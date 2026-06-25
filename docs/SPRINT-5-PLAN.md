# Sprint 5 Plan — Client Access + Expiration + QR Code

> **Duration:** 1 week
> **Stories:** 14, 15, 16
> **Dependencies:** Sprint 4 complete (Proposal creation + send)
> **Goal:** Client can view a sent proposal via public URL. Proposals auto-expire after 20 min. Chef can share a QR code.

---

## 1. Codebase state before Sprint 5

### Backend

| Artifact | Status |
|----------|--------|
| `Proposal` schema | ✅ Full: `ProposalItem`, `EditHistoryEntry`, `viewedAt` (added), all indexes |
| `ProposalsService.findByToken()` | ✅ Sets `viewedAt` on first view, auto-expires if past due |
| `ProposalsService.send()` | ✅ Sets `enviado` + `expiresAt = now + 20 min` |
| `ProposalsController` | ✅ `POST /`, `GET /`, `GET /:token`, `GET /id/:id`, `PATCH /:id/send`, `PATCH /:id`, `DELETE /:id` |

### Frontend

| Page | Status |
|------|--------|
| `/prop/[token]` | ✅ Client-facing view with status, items, pricing, banners for expired/active |
| `/proposals/[id]` | ✅ Admin detail: Send + QR + copy link + viewedAt + Active badge |
| `/proposals` | ✅ List with status badges |
| `/proposals/new` | ✅ Create form |
| `/dashboard` | ✅ Stats + recent proposals |

---

## 2. Story 14 — Client Access

### 2.1 Flow

```
1. Chef sends proposal → gets unique /prop/{token} URL
2. Chef shares URL with client (email, WhatsApp, QR)
3. Client opens link
4. Server: findByToken() called
   a. If status === 'enviado' and expiresAt past → auto-expire
   b. If first view → set viewedAt timestamp
5. Client sees proposal with Active/Expired banner
6. Admin sees "Active" badge + viewedAt timestamp
```

### 2.2 APIs

| Method | Route | Auth | Returns |
|--------|-------|------|---------|
| `GET` | `/api/proposals/:token` | No | `Proposal` (populated) |

### 2.3 Frontend

| Page | What changed |
|------|-------------|
| `/prop/[token]` | Full client-facing proposal view: header, info cards, items, pricing, status banners |
| `/proposals/[id]` | Added `viewedAt` display, "Active" badge when `enviado` + `viewedAt` set |

### 2.4 Boundary cases

| # | Case | Behavior |
|---|------|----------|
| 14.1 | Token doesn't exist | Show "Proposal not found" |
| 14.2 | Proposal expired | Show expired banner, client can still view content |
| 14.3 | Client refreshes | `viewedAt` already set, no duplicate update |
| 14.4 | Network failure | Error message, retry not needed (read-only view) |

---

## 3. Story 15 — Expiration

### 3.1 Flow

```
1. Chef sends proposal → expiresAt set to now + 20 min
2. Client opens link at T+25 min
3. findByToken() detects status === 'enviado' && expiresAt < now
4. Auto-sets status → 'expirado'
5. Page shows "This proposal has expired" banner
6. Admin detail shows Expired badge
```

### 3.2 Backend

Already implemented in `ProposalsService.findByToken()`:

```typescript
if (proposal.status === 'enviado' && proposal.expiresAt < new Date()) {
  proposal.status = 'expirado';
}
```

### 3.3 Frontend

| Page | What changed |
|------|-------------|
| `/prop/[token]` | Expired banner with message to contact chef |
| `/proposals/[id]` | Expired badge, "(Expired)" note if past due but status still `enviado` |

### 3.4 Boundary cases

| # | Case | Behavior |
|---|------|----------|
| 15.1 | Client opens AFTER expiration | Auto-expired, banner shown |
| 15.2 | Client opens BEFORE expiration | Active, no banner |
| 15.3 | Admin views expired proposal | Status badge shows "Expired" |
| 15.4 | Proposal never sent (borrador) | No expiration logic applies |

---

## 4. Story 16 — QR Code

### 4.1 Flow

```
1. Chef opens /proposals/:id (sent proposal)
2. QR code auto-generated from public URL
3. Chef can scan QR or share the image
4. QR links to /prop/{token}
```

### 4.2 Frontend

| Page | What changed |
|------|-------------|
| `/proposals/[id]` | QR code rendered next to public URL when `enviado` or `expirado` |

### 4.3 Implementation

Uses `qrcode` npm package (already installed in web):

```typescript
import QRCode from 'qrcode';
const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
```

### 4.4 Boundary cases

| # | Case | Behavior |
|---|------|----------|
| 16.1 | `qrcode` fails to render | Silent fail, no QR shown |
| 16.2 | Proposal in `borrador` | No QR shown (no public URL yet) |
| 16.3 | Proposal expired | QR still shown (URL still works, shows expired page) |

---

## 5. No changes needed

| Area | Reason |
|------|--------|
| Mongoose schema (other than `viewedAt`) | Already fully defined |
| Shared types | Already defined |
| Pricing engine | Not involved |
| Plate Builder components | Already reusable |
| Zustand store | Not involved |
| Package.json | `qrcode` already installed |
| Docker / CI | No infra changes |

---

## 6. Definition of Done

### Story 14 — Client Access
- [x] `viewedAt` field added to Proposal schema
- [ ] `findByToken()` sets `viewedAt` on first access
- [x] Admin detail shows "Active" badge when `enviado` + `viewedAt`
- [x] Admin detail shows viewedAt timestamp
- [x] Public page renders full proposal with pricing
- [ ] `pnpm typecheck && pnpm build` passes

### Story 15 — Expiration
- [x] `findByToken()` auto-expires if past due
- [x] Public page shows expired banner
- [x] Admin detail shows Expired badge
- [ ] `pnpm typecheck && pnpm build` passes

### Story 16 — QR Code
- [x] QR code generated on admin detail page for sent proposals
- [ ] `pnpm typecheck && pnpm build` passes
