# Engram Memory Record — AromaSabor

> **Purpose:** Persistent project memory for AI-assisted development
> **Binary:** `C:\Users\brik3\Documents\Desarrollos\engram-bin\engram_1.17.0_windows_amd64`
> **Last save:** Observation #11 — Sprint 5 (Stories 14-16) — Client Access, Expiration, QR Code

---

## 1. Project Identity

```
Name:        AromaSabor
Type:        SaaS Web Platform
Industry:    Catering / Banquet halls / Gastronomic events
Repository:  (to be created — GitHub)
Monorepo:    Turborepo (pnpm)
```

---

## 2. Business Context

### Problem
Banquet halls and caterers manually manage menu proposals via WhatsApp, calls, and emails. No traceability, no visual experience, no collaborative negotiation.

### Solution
A web platform where chefs create digital menus, send time-limited proposals to clients, and collaboratively negotiate via a visual plate builder.

### Key Business Rules
1. Menus are **permanent** — they never expire.
2. Proposals **expire** — default 20 minutes (hardcoded for MVP).
3. Both chef and client can **edit** the proposal.
4. Each edit generates an **in-app notification**.
5. The **Plate Builder Visual** is the core differentiator.
6. MVP is **web-only** (Next.js 15 + NestJS).
7. No mobile app, no Socket.IO, no WhatsApp, no OTP, no FCM.

---

## 3. Approved MVP Scope — 20 Stories

### Track 1 — Auth + Menus (Sprint 1)
1. Admin login with email + password, JWT httpOnly cookie
2. Create menu with name and unique slug
3. Add categories (label, maxItems limit)
4. Add items (name, image URL, portion grams, price per portion)
5. Publish menu (activate, public URL)

### Track 2 — Plate Builder (Sprint 2-3)
6. View public menu with categories and items
7. Select items by tapping categories
8. Visual plate: items stack in centered view with CSS animations
9. Replace or remove items from the plate
10. Adjust number of people for real-time price update
11. Live price per plate and total price with breakdown

### Track 3 — Proposals (Sprint 4-5)
12. Chef creates a proposal in DRAFT (pre-selects items, sets client/event info)
13. Chef sends proposal → status SENT, generates UUID token, starts 20min timer
14. Client opens `/prop/:token` → sees Plate Builder, status becomes ACTIVE
15. Cron job expires proposals every 30s → EXPIRED screen (no content visible)
16. Chef downloads QR code for any sent/active proposal

### Track 4 — Negotiation (Sprint 6-7)
17. Client edits proposal → MODIFIED_BY_CLIENT, chef notified
18. Chef edits proposal from dashboard → MODIFIED_BY_CHEF, client sees banner
19. Either party approves (APPROVED) or rejects (REJECTED) — terminal states
20. In-app notification panel for chef (title, message, timestamp, proposal link, unread badge)

### Explicitly NOT in MVP
- Cloudinary image upload (paste URL)
- Configurable expiration (hardcode 20 min)
- Manual revocation / extend timer
- Client email/phone fields
- Edit history diff UI
- Dashboard metrics
- Mobile app
- Socket.IO
- FCM / Push
- WhatsApp / OTP
- Multi-tenant
- Advanced watermarks
- Automated tests (manual testing only)

---

## 4. Technology Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Monorepo | Turborepo + pnpm | Shared types, incremental builds |
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Rapid UI development, SSR |
| Backend | NestJS + Mongoose | Modular, TypeScript-native |
| Database | MongoDB Atlas (free tier) | Flexible documents, free tier |
| Auth | JWT + bcrypt + httpOnly cookie | Simple, no third-party dependency |
| QR | `qrcode` npm package | Zero external API dependency |
| State | Zustand | Lightweight, no boilerplate |
| API client | TanStack Query (React Query) | Caching, refetch, stale-while-revalidate |
| Animations | CSS transitions + Framer Motion | No React Native dependency |
| CI/CD | GitHub Actions | Free for public/private repos |
| Hosting | Railway (API) + Vercel (Web) | Free tier, simple deploy |

---

## 5. Sprint Plan

```
Sprint 1 (2 weeks) → Stories 1-5   (Auth + Menus) ✅
Sprint 2 (2 weeks) → Stories 6-8   (Plate Builder: view + select + visual) ✅
Sprint 3 (2 weeks) → Stories 9-11  (Plate Builder: replace ✅ + qty ✅ + pricing ✅)
Sprint 4 (1 week)  → Stories 12-13 (Proposal: create + send)
Sprint 5 (1 week)  → Stories 14-16 (Proposal: access + expiration + QR)
Sprint 6 (1 week)  → Stories 17-18 (Negotiation: edits)
Sprint 7 (1 week)  → Stories 19-20 (Negotiation: approve/reject + notifications)
```

---

## 6. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  apps/web (Next.js 15)                               │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ (admin)/          │  │ (public)/                │  │
│  │   login           │  │   menu/[slug]            │  │
│  │   dashboard       │  │   prop/[token]           │  │
│  │   menus           │  │   prop/[token]/expired   │  │
│  │   proposals       │  │                          │  │
│  │   notifications   │  │   PlateBuilder (shared)  │  │
│  └──────────────────┘  └──────────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │ REST API
┌──────────────────────▼───────────────────────────────┐
│  apps/api (NestJS)                                    │
│  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Auth    │ │ Menu   │ │ Proposal │ │ Notification│ │
│  │ Module  │ │ Module │ │ Module   │ │ Module     │ │
│  └─────────┘ └────────┘ └──────────┘ └────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Common: Guards, Filters, Pipes, Decorators      │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │
               MongoDB Atlas
```

---

## 7. Domain Model (Final — MVP)

### Menu (permanent)
```
_id, name, slug, adminId, isActive, categories[], createdAt, updatedAt
```
- `categories[]`: `{id, label, maxItems, required, items[]}`
- `items[]`: `{id, name, imageUrl?, portionGrams, pricePerPortion, unit, isAvailable}`

### Proposal (expires)
```
_id, menuId, adminId, token (UUID),
clientName, eventName, numberOfPeople,
selectedItems[], pricePerPlate, totalPrice,
status (enum), expiresAt, durationMinutes (default 20),
viewedAt?, isRevoked?, editHistory[], statusHistory[],
createdAt, updatedAt
```

### Notification
```
_id, recipientId, proposalId, type, title, message, isRead, readAt?, createdAt
```

### Admin
```
_id, email (unique), passwordHash (bcrypt), name, createdAt
```

---

## 8. V2 Candidates (ordered by value)

1. Firebase Cloud Messaging — push notifications
2. Expo / React Native mobile app
3. Socket.IO — real-time updates
4. Multi-tenant — multiple caterers
5. Image upload (Cloudinary)
6. Configurable expiration duration
7. Manual revocation / extend timer
8. PWA — mobile-like experience
9. Dynamic watermarking server-side
10. OTP (email + WhatsApp)
11. Payment gateway (Wompi)
12. Analytics dashboard

---

## 9. Key Commands

```bash
# Engram
engram save "<title>" [--project aroma-sabor] [--scope workspace]
engram search "<query>" [--project aroma-sabor]
engram tui

# Dev
pnpm dev              # Start API + Web concurrently
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript check all packages
```

---

## 10. Session Record — 2026-06-25 (Sprint 3, Story 9)

### What was done

1. **Pricing engine fix**: `packages/utils/src/pricing.ts` — corrected `total` calculation from `roundHalfUp(subtotal + tax)` to `subtotal + tax` with individual line total rounding. Aligned with DOMAIN-MODEL.md invariant #4.

2. **`@aromasabor/utils` linked to web**: Added `"@aromasabor/utils": "workspace:*"` to `apps/web/package.json`. `pnpm install` creates a workspace symlink. `pnpm typecheck` and `pnpm build` pass.

3. **Story 9 — Replace and Remove**:
   - Extracted `PlateView` from inline code to `apps/web/components/PlateView.tsx` with `onItemTap` prop
   - Created `apps/web/components/PlateItemPopover.tsx` — popover with Remove/Replace buttons
   - Created `apps/web/components/ReplaceSelector.tsx` — modal showing replacement items
   - Updated `apps/web/app/(public)/menu/[slug]/page.tsx` to use components + Story 9 state flow
   - Fixed locale `es-MX` → `es-CO` in `formatPrice`

### Files created
- `apps/web/components/PlateView.tsx`
- `apps/web/components/PlateItemPopover.tsx`
- `apps/web/components/ReplaceSelector.tsx`

### Files modified
- `packages/utils/src/pricing.ts`
- `apps/web/package.json`
- `apps/web/app/(public)/menu/[slug]/page.tsx`
- `docs/PROJECT-STATUS.md`
- `docs/STORY-9-REPORT.md`
- `docs/ENGRAM-MEMORY.md`

### Verification
- `pnpm typecheck` — ✅ all 4 packages
- `pnpm build` — ✅ API + Web

### Next
- Story 11 — Live Pricing (IVA breakdown) ✅ completed below
```

---

## 11. Session Record — 2026-06-25 (Sprint 3, Story 10)

### What was done

1. **Zustand store extension**: Added `guestCount: number` (default 1) and `setGuestCount(count)` with validation (min 1, floors decimals, sanitizes NaN/empty) to `apps/web/stores/plate-store.ts`. Backward-compatible additive change.

2. **GuestCountInput UI**: Built directly in `page.tsx` — numeric input with +/− buttons, dark-theme styling matching existing components. − button disabled at min 1.

3. **Pricing Summary**: Live pricing section below the plate visual using `calculateQuotation()` from `@aromasabor/utils`. Shows per-plate cost, guest multiplier, subtotal, IVA (16%), and total. Updates reactively.

### Files modified
- `apps/web/stores/plate-store.ts` — guestCount + setGuestCount
- `apps/web/app/(public)/menu/[slug]/page.tsx` — GuestCountInput + pricing summary
- `docs/PROJECT-STATUS.md` — updated sprint status + Story 10 section
- `docs/STORY-10-REPORT.md` — created
- `docs/ENGRAM-MEMORY.md` — this record

### Verification
- `pnpm typecheck` — ✅ all 4 packages
- `pnpm build` — ✅ API + Web
- Page size: 3.37 kB → 4.05 kB

### Next
- Sprint 4 — Stories 12-13 (Proposals)
```

---

## 12. Session Record — 2026-06-25 (Sprint 3, Story 11)

### What was done

1. **PricingBreakdown component**: Created `apps/web/components/PricingBreakdown.tsx` — reusable component with props `items` and `guestCount`. Internally calculates per-category breakdown, price per plate, subtotal, IVA (16%), and total via `calculateQuotation()`.

2. **Category breakdown**: Each category with selected items shows its per-plate contribution. Only active categories render. Follows the fixed 4-category model (entrada, plato_fuerte, guarnicion, postre).

3. **Inline pricing replaced**: The inline pricing JSX in `page.tsx` (from Story 10) was replaced with a single `<PricingBreakdown>` component, removing the `calculateQuotation` import from the page.

### Files created
- `apps/web/components/PricingBreakdown.tsx`

### Files modified
- `apps/web/app/(public)/menu/[slug]/page.tsx` — replaced inline pricing with component
- `docs/PROJECT-STATUS.md` — Story 11 section + Sprint 3 status ✅
- `docs/STORY-11-REPORT.md` — created
- `docs/ENGRAM-MEMORY.md` — this record

### Verification
- `pnpm typecheck` — ✅ all 4 packages
- `pnpm build` — ✅ API + Web
- Page size: 4.05 kB → 4.17 kB
- No backend, store, schema, or pricing engine changes

### Sprint 3 complete
- Story 9 — Replace and Remove ✅
- Story 10 — Quantity Adjustment ✅
- Story 11 — Live Pricing ✅
```

---

## 13. Session Record — 2026-06-25 (Sprint 4, Story 12)

### What was done

1. **Backend DTOs**: Created `CreateProposalDto` and `CreateProposalItemDto` with class-validator decorators for proposal creation validation.

2. **ProposalsService refactor**: `create()` now accepts `CreateProposalDto` + `userId`, calls `calculateQuotation()` from `@aromasabor/utils`, sets `createdBy` from JWT, and defaults status to `borrador`. Added `findById()` for admin detail lookup.

3. **ProposalsController update**: `POST /` uses typed DTO + `@CurrentUser()`. Added `GET /id/:id` route for admin detail.

4. **API dependency added**: `@aromasabor/utils` linked to `apps/api/package.json`.

5. **Frontend — proposals list**: `/proposals` page fetches all proposals, displays cards with status badges, "New Proposal" button.

6. **Frontend — create form**: `/proposals/new` with menu selector, checkable items grouped by category, per-item quantity, client/event/guest fields, live PricingBreakdown preview, save with validation.

7. **Frontend — detail view**: `/proposals/[id]` shows client info, items, pricing breakdown, metadata.

8. **Dashboard update**: Stats cards (total/sent/draft), recent proposals list with links.

### Files created
- `apps/api/src/modules/proposals/dto/create-proposal.dto.ts`
- `apps/web/app/(admin)/proposals/new/page.tsx`
- `apps/web/app/(admin)/proposals/[id]/page.tsx`

### Files modified
- `apps/api/src/modules/proposals/proposals.service.ts`
- `apps/api/src/modules/proposals/proposals.controller.ts`
- `apps/api/package.json`
- `apps/web/app/(admin)/proposals/page.tsx`
- `apps/web/app/(admin)/dashboard/page.tsx`
- `docs/PROJECT-STATUS.md`
- `docs/STORY-12-REPORT.md`
- `docs/ENGRAM-MEMORY.md`

### Verification
- `pnpm typecheck` — ✅ all 4 packages
- `pnpm build` — ✅ API + Web
- New routes: `/proposals`, `/proposals/new`, `/proposals/[id]`

### Sprint 4 complete
- Story 12 — Create Proposal ✅
- Story 13 — Send Proposal ✅

### Sprint 5 complete
- Story 14 — Client Access ✅
- Story 15 — Expiration ✅
- Story 16 — QR Code ✅

## Sprint plan

### Sprint 6 — Negotiation (Stories 17-18)
- Story 17 — Client modifies proposal
- Story 18 — Chef modifies proposal

### Sprint 7 — Approval (Stories 19-20)
- Story 19 — Approve / Reject
- Story 20 — In-app notifications

---

## 14. Session Record — 2026-06-25 (Sprint 4-5 continuation)

### What was done

1. **Story 13 — Send Proposal**: Added `ProposalsService.send(id)` with status validation (`borrador` → `enviado`), sets `expiresAt = now + 20 min`, creates notification. Added `PATCH /:id/send` route. Frontend: Send button, confirmation dialog, public URL + copy link, read-only mode after send.

2. **B1 fix**: `create()` now sets `expiresAt: new Date(0)` for drafts — schema had `required: true` but service never assigned it, causing Mongoose validation errors.

3. **B2 — `viewedAt` approach**: Added optional `viewedAt?: Date` to Proposal schema instead of a new `activo` status. `findByToken()` sets it on first client view. Admin detail shows "Active" badge + timestamp.

4. **Story 14 — Client Access**: Built full client-facing `/prop/[token]` page with proposal details, pricing, status banners.

5. **Story 15 — Expiration**: `findByToken()` auto-expires if `enviado` and past `expiresAt`. Public page shows expired banner.

6. **Story 16 — QR Code**: Generates QR via `qrcode` package on admin detail page for sent/expired proposals.

### Files created
- `docs/STORY-13-REPORT.md`
- `docs/STORY-14-15-16-REPORT.md` (combined in PROJECT-STATUS)
- `docs/SPRINT-5-PLAN.md`

### Files modified
- `apps/api/src/schemas/proposal.schema.ts` — added `viewedAt`
- `apps/api/src/modules/proposals/proposals.service.ts` — `send()`, `findByToken()` updates, B1 fix
- `apps/api/src/modules/proposals/proposals.controller.ts` — `PATCH /:id/send`
- `apps/web/app/(admin)/proposals/[id]/page.tsx` — send flow + QR + viewedAt
- `apps/web/app/(public)/prop/[token]/page.tsx` — full client view
- `docs/PROJECT-STATUS.md`, `docs/ENGRAM-MEMORY.md`

### Verification
- `pnpm typecheck` — ✅ all 4 packages
- `pnpm build` — ✅ API + Web
- Commits: `4c93492` (Story 13), `7bafd7b` (Stories 14-16 + B1/B2)

### Progress
- 16 / 20 stories complete (80%)
- Next: Sprint 6 — Negotiation (Stories 17-18)
```
