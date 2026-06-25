# Story 12 — Create Proposal

> **Sprint:** 4
> **Status:** ✅ Complete
> **Date:** 2026-06-25

---

## What was built

### Backend

#### DTOs with validation

- **File:** `apps/api/src/modules/proposals/dto/create-proposal.dto.ts`
- `CreateProposalDto`: validates `menuId` (MongoId), `items` (array of `CreateProposalItemDto`), `clientName` (non-empty), `eventDate` (non-empty), `guestCount` (min 1), `notes` (optional)
- `CreateProposalItemDto`: validates `name`, `description`, `category` (enum), `price` (min 0), `quantity` (min 1)
- Uses `class-validator` + `class-transformer`

#### ProposalsService — `create()` refactored

- **File:** `apps/api/src/modules/proposals/proposals.service.ts`
- `create()` now accepts `CreateProposalDto` and `userId: string`
- Calculates `quotation` via `calculateQuotation()` from `@aromasabor/utils` before save
- Sets `createdBy`, `status: 'borrador'`, `token` (UUID v4)
- Added `findById(id)` method for admin detail view
- Added dependency `@aromasabor/utils` to `apps/api/package.json`

#### ProposalsController

- **File:** `apps/api/src/modules/proposals/proposals.controller.ts`
- `POST /` now uses `CreateProposalDto` and `@CurrentUser()` decorator
- Added `GET /id/:id` route (admin detail by Mongo `_id`)

### Frontend

#### Proposals list page (`/proposals`)

- Fetches all proposals via `GET /api/proposals`
- Displays cards with client name, event date, item count, guest count, quotation, status
- Status badges with color coding (Draft, Sent, etc.)
- "New Proposal" button linking to `/proposals/new`
- Empty state when no proposals exist

#### New proposal form (`/proposals/new`)

- Menu selector (dropdown of all menus, fetches via `GET /api/menus`)
- Items grouped by category with checkboxes and per-item quantity inputs
- Client name, event date, number of people, notes fields
- Live preview using `PricingBreakdown` component (reused from Sprint 3)
- Client-side validation: menu selected, at least 1 item, client name required, date required
- Saves via `POST /api/proposals`, redirects to `/proposals/:id` on success
- Error display on failure

#### Proposal detail page (`/proposals/[id]`)

- Fetches by Mongo `_id` via `GET /api/proposals/id/:id`
- Shows: client name, event date, status badge, menu name, guests, total
- Items list with quantities
- Pricing breakdown using `PricingBreakdown` component
- Notes display
- Metadata section (ID, token, created date)

#### Dashboard update

- Stats cards: total proposals, sent count, draft count
- Recent proposals list (last 5) with links to detail
- Empty state with link to create first proposal

---

## Files created

| File | Purpose |
|------|---------|
| `apps/api/src/modules/proposals/dto/create-proposal.dto.ts` | DTO with validation |
| `apps/web/app/(admin)/proposals/new/page.tsx` | Create proposal form |
| `apps/web/app/(admin)/proposals/[id]/page.tsx` | Proposal detail view |

## Files modified

| File | Change |
|------|--------|
| `apps/api/src/modules/proposals/proposals.service.ts` | `create()` uses DTO, `@aromasabor/utils`, `createdBy`; added `findById()` |
| `apps/api/src/modules/proposals/proposals.controller.ts` | `POST /` uses DTO + `@CurrentUser()`; added `GET /id/:id` |
| `apps/api/package.json` | Added `@aromasabor/utils` dependency |
| `apps/web/app/(admin)/proposals/page.tsx` | Full proposal list with status badges |
| `apps/web/app/(admin)/dashboard/page.tsx` | Stats cards + recent proposals |

---

## Verification

- `pnpm typecheck` — ✅ 4/4 packages pass
- `pnpm build` — ✅ API + Web build successful
- New routes: `/proposals` (1.48 kB), `/proposals/new` (3.13 kB), `/proposals/[id]` (2.4 kB)
- Dashboard updated (1.67 kB)
- No schema changes
- No shared types changes
- Pricing engine unchanged
