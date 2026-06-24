# Domain Model — AromaSabor MVP

> **Language:** Ubiquitous language (Spanish for business concepts, English for code)
> **Persistence:** MongoDB 7 via Mongoose 8
> **Pattern:** Value objects embedded in aggregate root documents

---

## Menu

Permanent catalog of gastronomic offerings. **Does not expire.**

```typescript
interface Menu {
  _id: ObjectId;
  name: string;                    // "Menú Ejecutivo Bodas"
  slug: string;                    // "menu-ejecutivo-bodas" (unique globally)
  description: string;
  items: MenuItem[];               // Embedded, flat list (no nested categories)
  createdBy: ObjectId;             // Ref → Admin
  createdAt: Date;
  updatedAt: Date;
}
```

**Invariants:**
- `slug` is auto-generated, globally unique, lowercase
- `items` can be empty (unpublished menu)

---

### MenuItem (value object, embedded in Menu)

```typescript
interface MenuItem {
  name: string;                    // "Pechuga a la Plancha"
  description: string;             // "Pechuga marinada con especias"
  category: CategoryType;          // "entrada" | "plato_fuerte" | "guarnicion" | "postre"
  price: number;                   // ≥ 0 COP, per-portion unit price
}
```

**Invariants:**
- `category` is one of the four fixed values
- `price` ≥ 0

---

## Proposal

The negotiable agreement between chef and client. **Expires.**

```typescript
interface Proposal {
  _id: ObjectId;
  menuId: ObjectId;                // Ref → Menu (source menu)
  token: string;                   // UUID v4, globally unique, URL-safe
  clientName: string;              // "María Gómez"
  eventDate: string;               // ISO 8601 date string
  guestCount: number;              // ≥ 1
  items: ProposalItem[];           // Snapshot of selected items + quantities
  notes: string;                   // Free text, optional
  status: ProposalStatus;          // See ProposalStatus enum below
  quotation: number;               // Pre-calculated total (see Pricing Engine)
  createdBy: ObjectId;             // Ref → Admin (chef who created it)
  expiresAt: Date;                 // Hardcoded 20 min from send/save
  lastModifiedBy?: EditorRole;     // "chef" | "cliente" — last editor
  lastModifiedAt?: Date;           // Timestamp of last edit
  editHistory?: EditHistoryEntry[];// Ordered list of edits (reserved for S6)
  createdAt: Date;
  updatedAt: Date;
}
```

**Invariants:**
- `token` is globally unique (UUID v4)
- `guestCount` ≥ 1
- `items` is a price snapshot — menu price changes do NOT affect existing proposals
- Terminal states: `aceptado`, `rechazado`, `expirado`

---

### ProposalItem (value object, embedded in Proposal)

```typescript
interface ProposalItem {
  name: string;                    // "Pechuga a la Plancha" (frozen at creation)
  description: string;
  category: CategoryType;          // Matches MenuItem.category
  price: number;                   // SNAPSHOT — frozen at proposal creation/edit
  quantity: number;                // ≥ 1
}
```

---

### ProposalStatus

```typescript
type ProposalStatus = 'borrador' | 'enviado' | 'modificado_por_cliente'
                    | 'modificado_por_chef' | 'aceptado' | 'rechazado'
                    | 'expirado';
```

---

### EditHistoryEntry (value object, embedded in Proposal)

```typescript
interface EditHistoryEntry {
  modifiedBy: EditorRole;    // "chef" | "cliente"
  modifiedAt: Date;
  note?: string;             // Optional reason for the edit
}
```

Reserved for Sprint 6. No write logic implemented yet.

---

## Admin

System user (chef/caterer). Single-tenant V1.

```typescript
interface Admin {
  _id: ObjectId;
  email: string;                   // Unique, login credential, stored lowercase
  passwordHash: string;            // bcrypt
  name: string;
  role: 'admin';                   // Reserved for future role expansion
  createdAt: Date;
  updatedAt: Date;
}
```

**Invariants:**
- `email` is unique, case-insensitive (lowercased on save)

---

## Notification

In-app notification for the chef, scoped to a proposal.

```typescript
interface Notification {
  _id: ObjectId;
  proposalId: ObjectId;            // Ref → Proposal
  type: NotificationType;          // "proposal_created" | "proposal_updated"
                                   // | "proposal_accepted" | "proposal_rejected"
                                   // | "proposal_expired"
  message: string;                 // Human-readable text
  read: boolean;                   // Default false
  createdAt: Date;                 // Only createdAt (no updatedAt)
}
```

---

## Entity Relationship Diagram

```
┌─────────┐          ┌────────────┐
│  Admin  │1─────────│    Menu     │
│         │  createdBy│            │
│ email   │          │ name       │
│ pwdHash │          │ slug       │
│ name    │          │ items[]──┐ │
└─────────┘          └──────────┼─┘
                                │ MenuItem (VO)
                                │ name, description
         ┌──────────────────────┤ category, price
         │                      └──────────────
         ▼
  ┌──────────────────┐         ┌──────────────┐
  │     Proposal     │         │ Notification │
  │                  │         │              │
  │ menuId ──────────┤──→ Menu │ proposalId ──┤
  │ token (UUID)     │         │ type         │
  │ clientName       │         │ message      │
  │ eventDate        │         │ read         │
  │ guestCount       │         │ createdAt    │
  │ items[]──┐       │         └──────────────┘
  │ notes    │       │
  │ status   │       │
  │ quotation│       │
  │ expiresAt│       │
  │ createdBy│───────┤──→ Admin
  │ lastModifiedBy  │
  │ lastModifiedAt  │
  │ editHistory[]──┐│
  └────────────────┼┤
                   ││
      ProposalItem (VO)   EditHistoryEntry (VO)
      name, description    modifiedBy, modifiedAt, note?
      category, price
      quantity
```

---

## Indexes

### `admins`
- `{ email: 1 }` — unique (login lookup)

### `menus`
- `{ slug: 1 }` — unique (public URL lookup)
- `{ createdBy: 1 }` — admin listing

### `proposals`
- `{ token: 1 }` — unique (public access by token)
- `{ status: 1, expiresAt: 1 }` — expiration cron job
- `{ createdBy: 1 }` — dashboard listing

### `notifications`
- `{ read: 1, createdAt: -1 }` — notification list

---

## Pricing Engine

Pure function in `packages/utils/src/pricing.ts`.

```typescript
function calculateQuotation(items: QuotationItem[]): QuotationResult;
```

**Input:**
```typescript
interface QuotationItem {
  price: number;       // Unit price per portion (≥ 0)
  quantity: number;    // Number of portions (≥ 1)
}
```

**Output:**
```typescript
interface QuotationResult {
  subtotal: number;    // Σ(price × quantity)
  tax: number;         // 16% IVA, half-up to 2 decimals
  total: number;       // subtotal + tax, half-up to 2 decimals
}
```

**Invariants:**
1. Line total = unit price × quantity (exact product)
2. Subtotal = sum of all line totals (exact sum)
3. Tax = 16% of subtotal, half-up rounded to 2 decimals
4. Total = subtotal + tax (exact sum)
5. Every item must have `price ≥ 0` and `quantity ≥ 1`
6. Empty items list returns `{ subtotal: 0, tax: 0, total: 0 }`

---

## State Machine

```
                  borrador (DRAFT)
                      │
                      ▼
                    enviado (SENT)
                      │
              ┌───────┼────────┐
              ▼       ▼        ▼
     modificado_   modificado_  expirado
     por_cliente   por_chef   (EXPIRED)
              │       │
              └───┬───┘
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
       aceptado  rechazado  expirado
      (APPROVED)(REJECTED) (EXPIRED)
```

**Transitions:**
- `borrador` → `enviado`: Chef sends proposal (starts 20 min timer, sets expiresAt)
- `enviado` → `modificado_por_cliente`: Client edits items (S6)
- `enviado` | `modificado_por_chef` → `modificado_por_cliente`: Client edits after chef (S6)
- `enviado` | `modificado_por_cliente` → `modificado_por_chef`: Chef edits after client (S6)
- `enviado` | `modificado_por_cliente` | `modificado_por_chef` → `aceptado`: Either party approves (S7)
- `enviado` | `modificado_por_cliente` | `modificado_por_chef` → `rechazado`: Either party rejects (S7)
- `borrador` | `enviado` | `modificado_por_cliente` | `modificado_por_chef` → `expirado`: Cron job

Transitions validated server-side. Invalid transitions return HTTP 409 Conflict.
