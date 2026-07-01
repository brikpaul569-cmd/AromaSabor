# Project Status — AromaSabor

> **Date:** 2026-06-30
> **Phase:** MVP Complete ✅ | Client-Experience enhancement underway (PR 1 ✅, PR 2 🚧)
> **Remaining:** Client-Experience PR 2 (Claim, Timeline), push PR 1 to remote, E2E verification, volume pricing (pending spec), images in bowl builder (deferred)
> **Developer:** Single senior/mid developer
> **Projected MVP:** 10 weeks

---

## 1. Executive Summary

AromaSabor is a web platform for banquet halls and caterers to collaboratively build and negotiate gastronomic proposals with clients.

**Core loop:**
1. Chef creates a menu (permanent, does not expire)
2. Chef creates a proposal from the menu and sends it to client
3. Client accesses via unique token URL or QR code
4. Client builds their plate step-by-step via the Bowl Builder — ingredients appear as layers in a visual bowl with live pricing
5. Chef and client negotiate by editing the proposal back and forth
6. Proposal auto-expires after 20 minutes (configurable in V2)
7. Either party approves or rejects — cycle ends

**Key differentiator:** Bowl Builder — client sees ingredients stack visually in a bowl as they step through categories, with live per-portion pricing.

---

## 2. Business Rules (Final)

| Rule | Value |
|------|-------|
| Menus expire? | **No** — permanent |
| Proposals expire? | **Yes** — time-limited |
| Default expiration | 20 minutes |
| Who can edit proposals? | Both chef and client |
| Notifications | In-app database only (no push/email) |
| Platform | Web-only (Next.js 15) |
| Image upload | Paste URL (no Cloudinary in MVP) |
| Mobile app | V2 |
| Real-time | Manual refresh / polling |

---

## 3. Approved Scope — 20 Stories

| # | Story | Track | Sprint |
|---|-------|-------|--------|
| 1 | Admin login | Auth + Menus | S1 |
| 2 | Create menu | Auth + Menus | S1 |
| 3 | Manage categories | Auth + Menus | S1 |
| 4 | Manage items | Auth + Menus | S1 |
| 5 | Publish menu | Auth + Menus | S1 |
| 6 | View menu | Plate Builder | S2 |
| 7 | Select items | Plate Builder | S2 |
| 8 | Visual plate | Plate Builder | S2 |
| 9 | Replace and remove | Plate Builder | S3 |
| 10 | Quantity adjustment | Plate Builder | S3 | ✅
| 11 | Live pricing | Plate Builder | S3 | ✅
| 12 | Create proposal | Proposals | S4 | ✅
| 13 | Send proposal | Proposals | S4 | ✅
| 14 | Client access | Proposals | S5 | ✅
| 15 | Expiration | Proposals | S5 | ✅
| 16 | QR code | Proposals | S5 | ✅
| 17 | Client modifies | Negotiation | S6 | ✅
| 18 | Chef modifies | Negotiation | S6 | ✅
| 19 | Approve / Reject | Negotiation | S7 | ✅
| 20 | In-app notifications | Negotiation | S7 | ✅

---

## 4. Technology Stack (MVP)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, custom dark-theme components |
| Backend | NestJS, TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (httpOnly cookies), bcrypt |
| QR | `qrcode` npm package |
| State | Zustand (Plate Builder) |
| Data fetching | React Query (TanStack Query) |
| Animations | CSS transitions + Framer Motion |
| Monorepo | Turborepo |
| Package manager | pnpm |

---

## 5. Sprint Allocation (Final)

```
Sprint 1 (2 weeks) → Stories 1-5   (Auth + Menus) ✅
Sprint 2 (2 weeks) → Stories 6-8   (Plate Builder pt 1: view + select + visual) ✅
Sprint 3 (2 weeks) → Stories 9-11  (Plate Builder pt 2: replace, qty, pricing) ✅
Sprint 4 (1 week)  → Stories 12-13 (Proposal creation + send) ✅
Sprint 5 (1 week)  → Stories 14-16 (Client access, Expiration, QR) ✅
Sprint 6 (1 week)  → Stories 17-18 (Bidirectional editing) ✅
Sprint 7 (1 week)  → Stories 19-20 (Approve/reject + notifications) ✅
                       ─────────
                         10 weeks
                       ✅ MVP COMPLETE
```

---

## 6. Inconsistencies Found vs Resolved

| Document | Issue | Resolution |
|----------|-------|-----------|
| MVP-DECISION.md | Says "Cloudinary ✅ MVP" | ❌ **Removed** — paste URL |
| MVP-DECISION.md | Says "Configurable duration ✅ MVP" | ❌ **Removed** — hardcode 20 min |
| MVP-DECISION.md | Says "Manual revocation ✅ MVP" | ❌ **Removed** — V2 |
| MVP-DECISION.md | Says "Next.js 14" | ✅ Updated to Next.js 15 |
| SPRINT-PLAN.md | Old 47-story, 11-week plan | ❌ **Deprecated** — use MVP-SCOPE-FINAL.md |
| MVP-BACKLOG.md | 47 stories, not 20 | ❌ **Deprecated** — use MVP-SCOPE-FINAL.md |
| DOMAIN-MODEL.md | Missing `isActive` on Menu, `description` shown as required, no `_id` on MenuItem | ✅ **Updated** in session — now matches actual schemas |
| Case study v2 | Mentions React Native, FCM, Socket.IO, OTP | All removed for MVP |

---

## 7. Sprint 0 — Infrastructure (Complete)

### What was built

- **Monorepo root:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.prettierrc`, `.env.example`
- **NestJS API** (`apps/api/`): 4 Mongoose schemas (Admin, Menu, Proposal, Notification) with indexes, 4 modules each with module/service/controller, JWT auth strategy + guards + decorators, global exception filter, cookie-parser, CORS, ValidationPipe
- **Next.js 15 Web** (`apps/web/`): Tailwind 3, root layout with TanStack Query provider, landing page, admin group (login/dashboard/menus/proposals), public group (menu [slug] / prop [token])
- **Packages:** `shared-types` (all TS interfaces), `utils` (pricing engine with half-up rounding)
- **Infrastructure:** `docker-compose.yml` (MongoDB 7 + API), `apps/api/Dockerfile`, `.github/workflows/ci.yml` (lint + typecheck + build on PR/push), `README.md`

### Sprint 0 outcomes

- ✅ `pnpm install` — dependencies installed
- ✅ `pnpm typecheck` — passes all 4 packages
- ✅ `pnpm build` — API + Web build successfully
- ✅ `.env` — created from `.env.example`
- ❌ Git repo — not initialized

### Next

Sprint 1 (Stories 1–5).

---

## 8. Sprint 1 — Story 1 (Admin Login) ✅

### Endpoints created

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create admin + set JWT cookie |
| POST | `/api/auth/login` | Validate credentials + set JWT cookie |
| POST | `/api/auth/logout` | Clear JWT cookie |
| GET | `/api/auth/me` | Return authenticated admin (JWT guard) |

### Files created

- `apps/web/lib/api.ts` — fetch wrapper with credentials
- `apps/web/app/(admin)/layout.tsx` — protected admin layout

### Files modified

- `apps/api/src/modules/auth/auth.service.ts` — added register(), getProfile()
- `apps/api/src/modules/auth/auth.controller.ts` — added register/logout/me endpoints, login sets httpOnly cookie
- `apps/web/app/(admin)/login/page.tsx` — functional form (login + register toggle)
- `apps/web/app/(admin)/dashboard/page.tsx` — shows admin name + logout button
- `turbo.json` — `pipeline` → `tasks` (Turbo 2.x compat)
- Various — fixed import paths (`../schemas/` → `../../schemas/`)

---

## 9. Sprint 1 — Story 2 (Create Menu) ✅

### Endpoints created/modified

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/menus` | JWT | Create menu (auto-generates slug, sets `createdBy` to current admin) |
| GET | `/api/menus` | No | List all menus |
| GET | `/api/menus/:id` | No | Get menu by MongoDB ID |

### Schema changes

- `Menu` schema: added `isActive: boolean (default false)`
- `description` is now optional (default `''`)
- Slug auto-generated from name with collision handling (`-{timestamp}` suffix)

### Files created

- `apps/web/app/(admin)/menus/new/page.tsx` — create menu form (name + optional description)
- `apps/web/app/(admin)/menus/new/` — route directory

### Files modified

- `apps/api/src/schemas/menu.schema.ts` — added `isActive`, made `description` optional
- `apps/api/src/modules/menus/menus.service.ts` — added slugify(), `findById()`, `create()` uses `@CurrentUser`
- `apps/api/src/modules/menus/menus.controller.ts` — `POST`/`GET :id`/`PATCH`/`DELETE` use JWT guards + `@CurrentUser`; route `:slug` → `:id`
- `apps/web/app/(admin)/menus/page.tsx` — dynamic list with cards (name, description, active/draft status)
- `apps/web/app/(admin)/layout.tsx` — added navigation bar (Dashboard, Menus, Proposals)
- `packages/shared-types/src/index.ts` — added `isActive` to `Menu` interface, made `description` optional

---

## 10. Sprint 1 — Stories 3–4 (Manage Categories & Items) ✅

### Endpoints created

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/menus/:id/items` | JWT | Add item to menu (name, description, category, price) |
| PATCH | `/api/menus/:id/items/:itemId` | JWT | Update specific item fields |
| DELETE | `/api/menus/:id/items/:itemId` | JWT | Remove item from menu |

### Shared type changes

- `MenuItem` now includes `_id: string` (Mongoose auto-generated subdocument ID)

### Files created

- `apps/web/app/(admin)/menus/[id]/page.tsx` — full menu editor page with:
  - Items grouped by category (entrada, plato_fuerte, guarnicion, postre)
  - Add item form (name, description, category dropdown, price)
  - Edit/delete buttons per item

### Files modified

- `apps/web/app/(admin)/menus/page.tsx` — cards now link to editor (`/menus/:id`)
- `apps/api/src/modules/menus/menus.service.ts` — added `addItem()`, `updateItem()`, `removeItem()`
- `apps/api/src/modules/menus/menus.controller.ts` — added item CRUD endpoints
- `packages/shared-types/src/index.ts` — added `_id` to `MenuItem`

---

## 11. Sprint 1 — Story 5 (Publish Menu) ✅

### Endpoints created

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| PATCH | `/api/menus/:id/publish` | JWT | Toggle `isActive` flag |
| GET | `/api/menus/slug/:slug` | No | Public lookup by slug (only returns if `isActive: true`) |

### Files modified

- `apps/api/src/modules/menus/menus.service.ts` — added `publish()`, `findBySlug()`
- `apps/api/src/modules/menus/menus.controller.ts` — added publish + findBySlug endpoints
- `apps/web/app/(admin)/menus/[id]/page.tsx` — added publish/unpublish toggle button with public URL display
- `apps/web/app/(public)/menu/[slug]/page.tsx` — full public menu page with items grouped by category, prices, and total

### What the public page shows

- Menu name, description, chef name
- Items grouped by category (entrada, plato_fuerte, guarnicion, postre)
- Each item: name, description, price
- Total price (before IVA)
- If menu not found or not published: "Menu not found" message

---

## 12. Sprint 2 — Plate Builder (Stories 6–8) ✅

### What was built

- **Plate visual**: centered stacked plate view with layered categories (entrada → plato_fuerte → guarnicion → postre), each with name + weight display. CSS fade-in animation on selection.
- **Item selection**: category accordion with item list (name, description, weight, price). Tap to select/deselect. Max 1 item per category.
- **Zustand store** (`apps/web/stores/plate-store.ts`): manages one selection per category, with select/deselect/clear/isSelected helpers.
- **Weight field** added to MenuItem schema (grams, optional). Included in admin menu editor form and displayed in both admin edit and public plate view.

### Files created

- `apps/web/stores/plate-store.ts`
- `apps/web/hooks/` — directory created (ready for Sprint 3)

### Files modified

- `apps/api/src/schemas/menu.schema.ts` — added `weight` to MenuItem
- `packages/shared-types/src/index.ts` — added `weight` to MenuItem interface
- `apps/web/app/(admin)/menus/[id]/page.tsx` — weight field in form, weight shown in item list
- `apps/web/app/(public)/menu/[slug]/page.tsx` — full Plate Builder with selection + visual
- `apps/web/tailwind.config.js` — added `fadeIn` keyframe animation
- `apps/api/src/modules/menus/menus.service.ts` — added weight to updateItem signature

### Pricing engine alignment

- **`packages/utils/src/pricing.ts`**: Fixed double-rounding inconsistency. `total` was `roundHalfUp(subtotal + tax)`, violating invariant #4 ("Total = subtotal + tax (exact sum)"). Now each line total is rounded first, subtotal sums rounded line totals, tax is half-up rounded, and total = subtotal + tax (exact sum). Aligned with DOMAIN-MODEL.md invariants.

### Sprint 3 complete ✅

All three Sprint 3 stories (9–11) are implemented.

---

## 13. Sprint 3 — Story 9 (Replace and Remove) ✅

### What was built

- **PlateItemPopover**: Tap any layer in the plate visual → popover with Remove / Replace options.
- **Remove**: Calls `deselectItem()` — item disappears, category becomes empty.
- **Replace**: Opens `ReplaceSelector` modal showing other items in same category. Selecting one calls `selectItem()`.
- **Boundary cases**: Replace disabled when category has ≤1 item; closing selector without selecting returns to popover; click outside closes popover.

### Files created

- `apps/web/components/PlateView.tsx` — extracted from inline page code, now reusable (`onItemTap` callback)
- `apps/web/components/PlateItemPopover.tsx` — Remove/Replace popover
- `apps/web/components/ReplaceSelector.tsx` — item list for replacement

### Files modified

- `apps/web/app/(public)/menu/[slug]/page.tsx` — uses extracted components + Story 9 state/logic
- `apps/web/package.json` — added `@aromasabor/utils` dependency
- `packages/utils/src/pricing.ts` — fixed total calculation (double rounding)

### Deuda corregida

- locale `es-MX` → `es-CO` en `formatPrice()`

---

## 14. Sprint 3 — Story 10 (Quantity Adjustment) ✅

### What was built

- **GuestCountInput**: Numeric input with +/− buttons (min 1, clamp invalid values to 1) in the public menu page.
- **Zustand store extension**: `guestCount` state and `setGuestCount` action added to `plate-store.ts`. Validation: min 1, floors decimals, sanitizes NaN/empty to 1.
- **Pricing Summary**: Live calculation using `calculateQuotation` from `@aromasabor/utils`. Shows per-plate cost, guest count multiplier, subtotal, IVA (16%), and total. Updates reactively when selections or guest count change.

### Files modified

| File | Change |
|------|--------|
| `apps/web/stores/plate-store.ts` | Added `guestCount: number` (default 1), `setGuestCount()` with validation |
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Added GuestCountInput UI, pricing summary section, `calculateQuotation` import |

### Verification

- `pnpm typecheck` — ✅ 4/4 packages pass
- `pnpm build` — ✅ API + Web build successful
- `/menu/[slug]` page size: 3.37 kB → 4.05 kB (GuestCountInput + pricing summary)
- No backend changes needed
- Store API extended backward-compatibly (additive change)

---

## 15. Sprint 3 — Story 11 (Live Pricing) ✅

### What was built

- **PricingBreakdown component** (`apps/web/components/PricingBreakdown.tsx`): Reusable pricing panel with category breakdown. Props: `items`, `guestCount`.
- **Category breakdown**: Each category with a selected item shows its per-plate contribution (Entrada, Plato Fuerte, Guarnición, Postre). Only categories with items appear.
- **Summary rows**: Price per plate, Number of people, Subtotal, IVA (16%), Total — all calculated via `calculateQuotation()`.
- **Instant updates**: Reactively re-renders on selection changes, replacements, and guest count changes.
- **Inline pricing replaced**: The inline JSX from Story 10 was replaced with a single `<PricingBreakdown>` component import.

### Files created

| File | Purpose |
|------|---------|
| `apps/web/components/PricingBreakdown.tsx` | Reusable pricing component with category-level breakdown |

### Files modified

| File | Change |
|------|--------|
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Replaced inline pricing block with `<PricingBreakdown>`, removed `calculateQuotation` import |

### Verification

- `pnpm typecheck` — ✅ 4/4 packages pass
- `pnpm build` — ✅ API + Web build successful
- `/menu/[slug]` page size: 4.05 kB → 4.17 kB
- No backend, store, pricing engine, or schema changes
- Component reusable by `/prop/[token]` in Sprint 5

---

## 16. Sprint 4 — Story 12 (Create Proposal) ✅

### What was built

**Backend:**
- **DTOs**: `CreateProposalDto` and `CreateProposalItemDto` with `class-validator` validation (menuId, items, clientName, eventDate, guestCount, notes)
- **Service**: `create()` now accepts DTO + userId, calculates `quotation` via `calculateQuotation()`, sets `createdBy` from JWT, generates UUID token, status defaults to `borrador`
- **Controller**: `POST /api/proposals` uses DTO + `@CurrentUser()`; added `GET /api/proposals/id/:id` for admin detail

**Frontend:**
- **Proposals list** (`/proposals`): Fetches all proposals, displays cards with status badges, "New Proposal" button
- **Create form** (`/proposals/new`): Menu selector → items grouped by category with checkboxes + per-item quantity → client/event/guest fields → live `PricingBreakdown` preview → Save as Draft
- **Detail view** (`/proposals/[id]`): Client info, items, pricing breakdown, metadata (token, dates)
- **Dashboard**: Stats cards (total/sent/draft), recent proposals list

### Files created

| File | Purpose |
|------|---------|
| `apps/api/src/modules/proposals/dto/create-proposal.dto.ts` | DTO with validation |
| `apps/web/app/(admin)/proposals/new/page.tsx` | Create proposal form |
| `apps/web/app/(admin)/proposals/[id]/page.tsx` | Proposal detail view |

### Files modified

| File | Change |
|------|--------|
| `apps/api/src/modules/proposals/proposals.service.ts` | `create()` uses DTO, `@aromasabor/utils`, `createdBy`; added `findById()` |
| `apps/api/src/modules/proposals/proposals.controller.ts` | `POST /` uses DTO + `@CurrentUser()`; added `GET /id/:id` |
| `apps/api/package.json` | Added `@aromasabor/utils` dependency |
| `apps/web/app/(admin)/proposals/page.tsx` | Full proposal list with status badges |
| `apps/web/app/(admin)/dashboard/page.tsx` | Stats cards + recent proposals |

### Verification

- `pnpm typecheck` — ✅ 4/4 packages pass
- `pnpm build` — ✅ API + Web build successful
- New routes: `/proposals` (1.48 kB), `/proposals/new` (3.13 kB), `/proposals/[id]` (2.4 kB)
- No schema or shared types changes

---

## 17. Sprint 4 — Story 13 (Send Proposal) ✅

### What was built

**Backend:**
- `ProposalsService.send(id)`: validates `status === 'borrador'` (409 otherwise), sets `enviado` + `expiresAt = now + 20 min`, creates notification
- `ProposalsController`: `PATCH /:id/send` (JWT-guarded)

**Frontend:**
- `/proposals/[id]`: Send button (only `borrador`), confirmation dialog with 20-min warning, public URL display + copy-to-clipboard, read-only styling after send, error handling with retry

### Boundary cases

| Case | Behavior |
|------|----------|
| Already `enviado` | Button hidden, URL shown |
| `expirado` | Badge + URL + expired note |
| Terminal status | Badge only, items dimmed |
| Network failure | Error shown, retry allowed |

### Files modified

| File | Change |
|------|--------|
| `apps/api/src/modules/proposals/proposals.service.ts` | Added `send()` method |
| `apps/api/src/modules/proposals/proposals.controller.ts` | Added `PATCH /:id/send` |
| `apps/web/app/(admin)/proposals/[id]/page.tsx` | Send flow + confirmation + copy + read-only |

---

## 18. Sprint 5 — Stories 14-16 (Client Access, Expiration, QR) ✅

### What was built

**B2 — `viewedAt` field:**
- Added optional `viewedAt?: Date` to Proposal schema
- `findByToken()` sets `viewedAt` on first client access (Story 14)
- `findByToken()` auto-expires if `enviado` and `expiresAt < now` (Story 15)

**Story 14 — Client Access:**
- `/prop/[token]` public page renders full proposal: client name, event date, menu, items, pricing breakdown, status badges
- Active/Expired banners for contextual feedback
- Admin detail shows "Active" badge (when `enviado` + `viewedAt`) and viewedAt timestamp

**Story 15 — Expiration:**
- Auto-expiration on access: if `enviado` and past `expiresAt`, status → `expirado`
- Public page shows red expired banner with instructions to contact chef
- Admin detail shows Expired badge

**Story 16 — QR Code:**
- Generates QR from public URL using `qrcode` package (already installed)
- Displayed next to public URL on admin `/proposals/[id]` page for sent/expired proposals

### Files modified

| File | Change |
|------|--------|
| `apps/api/src/schemas/proposal.schema.ts` | Added optional `viewedAt` field |
| `apps/api/src/modules/proposals/proposals.service.ts` | `findByToken()`: sets `viewedAt` + auto-expire |
| `apps/web/app/(public)/prop/[token]/page.tsx` | Full client-facing proposal view |
| `apps/web/app/(admin)/proposals/[id]/page.tsx` | Added QR code, viewedAt, Active badge |

---

## 19. Sprint 1 Complete 🎉

Sprint 1 at MVP scope (Stories 1–5) is fully implemented:

- ✅ Admin login (register, login, logout, protected layout)
- ✅ Create menu (name, description, auto-slug)
- ✅ Manage categories (4 category labels)
- ✅ Manage items (add, edit, delete items with category + price)
- ✅ Publish menu (toggle active, public page at `/menu/:slug`)

---

## 20. Risks (Final Assessment)

| # | Risk | Mitigation |
|---|------|------------|
| R1 | Plate Builder complexity for solo dev | Start with minimal CSS animations, skip Framer Motion if needed. Core value is visual selection, not the animation polish. |
| R2 | Expiration timer accuracy | Cron job every 30s is sufficient. Client-side countdown is cosmetic — server is source of truth. |
| R3 | Concurrent edits (chef + client) | Optimistic locking via `updatedAt`. Second writer gets 409 with the other's changes. |
| R4 | Token URL brute force | UUID v4 (122 bits entropy + rate limiting on /proposal/:token). |
| R5 | Single developer bus factor | Conventional commits, clean README, architecture docs. Worst case: another dev can pick up from docs. |
| R6 | Scope creep during development | Strict 20-story cap. Any new idea goes to V2 list. No exceptions. |

---

## 22. Sprint 5.5 — State Machine + i18n 🇪🇸

| Story | Description | Status |
|-------|-------------|--------|
| 17-18 | Proposal state machine (7 states, all valid transitions) | ✅ |
| 19 | Approve / Reject backend + frontend | ✅ |
| — | Edit history with previousItems/newItems/reason snapshots | ✅ |
| — | Frontend: status filter, monthly dashboard, history timeline | ✅ |
| — | i18n español-first con toggle a inglés | ✅ |
| — | Plate Builder Zustand refactor (type-safe, extracted) | ✅ |

### Proposal State Machine

**Backend** — `apps/api/src/modules/proposals/proposals.state-machine.ts`:
- `TRANSITIONS` map covering all 7 states
- `assertValidTransition()` with descriptive error messages

**Transitions:**
```
borrador → enviado
enviado → modificado_por_cliente | modificado_por_chef | aceptado | rechazado | expirado
modificado_por_cliente → modificado_por_chef | aceptado | rechazado | expirado
modificado_por_chef → modificado_por_cliente | aceptado | rechazado | expirado
aceptado → (terminal)
rechazado → (terminal)
expirado → (terminal)
```

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| PATCH | `/proposals/:id/approve` | JWT | Approve proposal |
| PATCH | `/proposals/:id/reject` | JWT | Reject proposal |
| PATCH | `/proposals/:id/status` | JWT | Generic transition with validation |
| GET | `/proposals/id/:id/history` | JWT | Get edit history |
| PATCH | `/proposals/:id` | JWT | Update proposal items (chef, with history) |
| GET | `/proposals/:token` | No | Public lookup (auto-expire, set viewedAt) |

### Edit History

Each status transition or item edit records:
- `modifiedBy`: `'chef' \| 'cliente'`
- `modifiedAt`: timestamp
- `previousItems[]`: snapshot before change
- `newItems[]`: snapshot after change
- `reason`: optional reason string

### i18n

Lightweight custom system (`apps/web/lib/i18n/`):
- React Context + localStorage persistence
- `useTranslation()` hook with `t('key', params)` function
- Spanish default (`es.json`), English toggle (`en.json`)
- `LanguageToggle` component in admin nav
- All 12 pages migrated to `t()` calls

### Plate Builder Refactor

| File | Purpose |
|------|---------|
| `apps/web/store/plate-builder.ts` | Zustand store — extracted from page, type-safe |
| `apps/web/lib/hooks/usePricing.ts` | `usePlatePricing()` hook — live quote calculation |
| `apps/web/lib/types/plate.ts` | Shared TypeScript types |
| `apps/web/components/plate-builder/` | Extracted: `CategoryAccordion`, `ItemCard`, `PricingBreakdown`, `EmptyPlate`, `SuccessModal` |
| `apps/web/components/plate-builder/PlateBuilder.tsx` | Orchestrator — connects store → UI |

---

## 23. What Success Looks Like (MVP)

- Chef can log in, create menus, add items
- Client opens a link, sees the Bowl Builder, builds a plate step-by-step
- Chef sends a proposal with a 20-minute expiration
- Client edits the proposal, chef gets notified
- Chef edits back, client gets notified
- Someone approves or rejects
- Chef downloads a QR code for the proposal
- Expired proposals show nothing
- All notifications live inside the app

---

## 24. Sprint 7 — Bowl Builder (Stories 6–8 Enhancement) ✅

### What changed

Redesigned the Plate Builder from an abstract stacked-circle visual to a **Chipotle-style Bowl Builder** with step-by-step category flow.

### Before vs. After

| Aspect | Before | After |
|--------|--------|-------|
| **Visual** | Concentric colored circles with item name | CSS bowl with colored ingredient layers stacking bottom-to-top |
| **Bowl shape** | Abstract `<div>` circles | U-shaped bowl via `border-radius` + elliptical rim with gradient |
| **Selection** | All categories as expandable accordions simultaneously | Step-by-step flow: one category at a time |
| **Navigation** | Open/close any accordion | Step indicator with numbered circles, Back/Next buttons, "Review your bowl" on last step |
| **Empty state** | Dashed border circle + text | Bowl silhouette + `UtensilsCrossed` icon + "Select items to build your bowl" |
| **Animations** | Simple CSS `fadeIn` keyframe | `AnimatePresence` + `motion.div` with staggered enter (100ms delay each layer), `layout` prop for smooth repositioning |
| **Progress** | None visible | Step indicator with green checkmarks for completed categories |

### How it works

1. **Empty bowl** shown on page load
2. Step indicator shows all menu categories as numbered steps
3. **Step 1** (first category): items listed for selection → select one → colored layer appears at bowl bottom
4. **Next** → Step 2: items for second category → select → second layer stacks above the first
5. Continue through all categories
6. **"Review your bowl"** on last step scrolls to pricing breakdown
7. Any step can be revisited by clicking its circle in the indicator
8. Clicking a layer in the bowl opens the existing Remove/Replace popover

### Files changed

| File | Action | Lines |
|------|--------|-------|
| `apps/web/components/PlateView.tsx` | Rewrite (bowl visual) | 167 |
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Modify (step flow) | 408 |

### Key technical decisions

- **Framer Motion** for animations (already a dependency in `package.json`): `AnimatePresence mode="popLayout"` with staggered delays
- **Inline rgba colors**: Tailwind classes can't be composed dynamically in Framer Motion `style` — mapped via `colorMap` (8 tailwind → rgba entries + fallback)
- **Same store/props**: No changes to `plate-store.ts`, `PricingBreakdown`, `PlateItemPopover`, or `ReplaceSelector` — all backward-compatible
- **Bow height**: Each layer = `Math.floor(BOWL_H / count)` for equal distribution; top layer gets rounded top corners for a "mound" effect
- **Bug fixed**: Moved `useRef` + `useCallback` before early returns in page.tsx to prevent React hook ordering violations

### What stayed the same

- ✅ Zustand store (`plate-store.ts`)
- ✅ PricingBreakdown component
- ✅ PlateItemPopover (tap layer → remove/replace)
- ✅ ReplaceSelector
- ✅ Guest count selector
- ✅ All pricing logic (per-portion, IVA, total)
- ✅ API endpoints and schemas

---

## 25. Revisions — 2026-06-30 ✅

### 🔧 Expiration Logic Overhaul

| Antes | Después |
|-------|---------|
| `findByToken()` auto-expiraba propuestas al cargarse (GET con side effect) | `findByToken()` es idempotente — no muta estado |
| `approveByToken()` / `rejectByToken()` sin check de expiración | Nuevo `assertNotExpired()` se ejecuta antes de `assertValidTransition()` |
| Frontend mostraba botones de aprobar/rechazar en propuestas vencidas | Botones ocultos cuando `isExpired === true` |

**Archivos:** `apps/api/src/modules/proposals/proposals.service.ts`, `apps/web/app/(public)/prop/[token]/page.tsx`

### 🔧 Replace en Plate Popover

| Antes | Después |
|-------|---------|
| "Reemplazar" gris si la categoría tenía ≤1 item | Siempre disponible — navega al paso de esa categoría para elegir otro item |
| Usaba `ReplaceSelector` modal (requería +2 items por categoría) | Se eliminó `replaceCategoryId`, `handleReplaceSelect` y `ReplaceSelector` de la página |

**Archivo:** `apps/web/app/(public)/menu/[slug]/page.tsx`

### 🔧 Nueva Propuesta (Chef)

| Antes | Después |
|-------|---------|
| Dropdown de menú con texto blanco sobre fondo blanco del OS | Options con `bg-gray-800 text-white` — visibles |
| Aparecían menús sin items en el dropdown | Filtrados: solo menús con `categories[].items[].isAvailable` |
| "Guardar borrador" | "Guardar propuesta" (nuevo key `saveProposal`) |
| Silencio si el menú no tiene items | Mensaje: "Este menú no tiene ítems disponibles" |

**Archivos:** `apps/web/app/chef/proposals/new/page.tsx`, `apps/web/lib/i18n/locales/{es,en}.json`

### 🔧 Creación de Menú

| Antes | Después |
|-------|---------|
| Crear menú → redirigía a lista `/chef/menus` | Crear menú → redirige al editor `/chef/menus/:id` para agregar categorías e items |

**Archivo:** `apps/web/app/chef/menus/new/page.tsx`

### 🔧 Script de limpieza

| Archivo | Propósito |
|---------|-----------|
| `scripts/expire-stale-proposals.cjs` | Marca como `expirado` propuestas en `enviado` con `expiresAt` pasado. Idempotente. |

### Remaining

1. **Git: push PR 1 to remote** — `develop` local está adelante de `origin/develop` (shortCode commits sin pushear)
2. **Client-Experience PR 2** — Complete Claim + Timeline components, merge to develop
3. **Client-Experience PR 3** — Notification integration for new events (proposal_client_responded, etc.)
4. **E2E test** — Verify full flow end-to-end
5. **Images in bowl builder** — Deferred per user request
6. **Volume pricing (Colombian pesos)** — Extra feature requested by user (no spec yet)

### Route changes (already done ✅)

| Old route | New route |
|-----------|-----------|
| `/dashboard` | `/chef/dashboard` |
| `/proposals` | `/chef/proposals` |
| `/menus` | `/chef/menus` |
| `(admin)/login` | `/login` |

---

## 26. Client-Experience Enhancement (SDD Change)

> **Branch:** `feat/client-experience-pr2` (basada en `develop` local)
> **Planning:** SDD with auto-chain delivery (stacked-to-develop)
> **PR 1:** ShortCodes + `/c/` route — ✅ Merged to local `develop`
> **PR 2:** ItemStatus + respuesta_parcial — 🚧 In progress (4/6 tasks done)
> **PR 3:** Timeline + notifications — ⏳ Planned

### PR 1 — ShortCodes + `/c/` Route ✅

**Purpose:** Replace opaque UUIDs in client URLs with human-friendly 7-char base58 codes.

| Component | Description |
|-----------|-------------|
| `packages/shared-types/src/index.ts` | Added `shortCode?: string` to `Proposal` interface |
| `apps/api/src/utils/base58.ts` | 7-char encoder (crypto.randomBytes, excludes 0/O/I/l) |
| `apps/api/src/schemas/proposal.schema.ts` | Added `shortCode` field (`unique: true, sparse: true`) |
| `apps/api/src/modules/proposals/proposals.service.ts` | `generateShortCode()` with 10-retry collision handling, `findByShortCode()`, lazy generation in `findByToken()` |
| `apps/api/src/modules/proposals/proposals.controller.ts` | `GET /proposals/code/:shortCode` (registered before `:token` to avoid route conflict) |
| `apps/web/app/(public)/c/[slug]/[shortCode]/page.tsx` | Public route — same layout as `/prop/[token]` |
| `apps/web/lib/i18n/locales/{es,en}.json` | Added `shortCode.copyUrl`, `shortCode.copied`, `shortCode.shareUrl` |

**Tests:** ✅ 38 tests pass (5 base58 unit + 13 proposals integration + 20 menus integration)

**Commits (local `develop`):**
```
0108693 feat(web): add shortCode i18n keys and /c/[slug]/[shortCode] public route
3b456d2 feat(api): add shortCode to schema, service, controller, and integration tests
9328757 feat(api): add base58 encoder with unit tests
63cdd9f feat(shared): add shortCode field to Proposal interface
```

### PR 2 — ItemStatus + respuesta_parcial 🚧

**Purpose:** Allow clients to accept/reject individual items in a proposal (partial response), tracked via `itemStatus` per item.

#### Done ✅

| Component | Description | Commit |
|-----------|-------------|--------|
| `packages/shared-types/src/index.ts` | Added `ItemStatus` type (`pendiente \| aceptado \| rechazado`), `itemStatus` field in `ProposalItem`, `respuesta_parcial` in `ProposalStatus`, `proposal_client_responded` in `NotificationType` | `d8e2591` |
| `apps/api/src/modules/proposals/proposals.state-machine.ts` | Added `respuesta_parcial` state with valid transitions: from `enviado`/`modificado_por_chef`, to `modificado_por_chef`/`aceptado`/`rechazado`/`expirado` | `d8e2591` |
| `apps/api/src/modules/proposals/dto/respond-items.dto.ts` | DTO for `POST /proposals/:id/respond-items` | `2261ba6` |
| `apps/api/src/modules/proposals/proposals.service.ts` | `submitItemResponse()` — validates token, updates each item's `itemStatus`, transitions to `respuesta_parcial`, creates notification | `2261ba6` |
| `apps/api/src/modules/proposals/proposals.controller.ts` | `POST /proposals/:id/respond-items` endpoint | `2261ba6` |
| `apps/api/src/modules/proposals/proposals.integration.test.ts` | Integration tests for submitItemResponse | `2261ba6` |
| `apps/api/src/modules/proposals/proposals.state-machine.spec.ts` | 12 unit tests for `respuesta_parcial` transitions | `d8e2591` |
| `apps/web/components/ItemStatusToggle.tsx` | Toggle component with 3 states (pendiente/aceptado/rechazado), color-coded pills (yellow/green/red) | `aaacc18` |
| `apps/web/lib/i18n/locales/{es,en}.json` | Added `itemStatus.*` keys (pending/accept/reject) | `aaacc18` |
| `apps/web/app/(public)/prop/[token]/page.tsx` | Integrated ItemStatusToggle for client to respond per item | `07ed415` |
| `apps/web/app/chef/proposals/[id]/page.tsx` | Chef detail shows itemStatus per item (read-only) | `07ed415` |

#### Pending ❌

| Component | Description |
|-----------|-------------|
| `Claim` | Client identity (`claimedAt`, `claimedByClientName`, `ClientIdentityDialog`) |
| `ProposalTimeline` | Visual timeline component for proposal lifecycle |
| Notification wiring | Ensure `proposal_client_responded` notifications trigger correctly |

### Notes

- **Git state:** `develop` local tiene PR 1 commits que no están en `origin/develop`. Antes de PR 2 merge, pushear `develop`.
- **Notification type** `proposal_client_responded` ya existe en shared-types y schema, pero falta asegurar que el frontend las muestre correctamente.
