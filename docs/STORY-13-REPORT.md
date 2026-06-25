# Story 13 — Send Proposal

> **Sprint:** 4
> **Status:** ✅ Complete
> **Date:** 2026-06-25

---

## What was built

### Backend

#### ProposalsService — `send(id)` method

- **File:** `apps/api/src/modules/proposals/proposals.service.ts`
- Validates proposal exists and `status === 'borrador'` (otherwise throws `ConflictException` / HTTP 409)
- Sets `status → 'enviado'`
- Sets `expiresAt → now + 20 min` (20 × 60 × 1000 ms)
- Creates notification via `NotificationsService` (type: `proposal_updated`)
- Returns updated proposal

#### ProposalsController — `PATCH /:id/send`

- **File:** `apps/api/src/modules/proposals/proposals.controller.ts`
- JWT-guarded
- Delegates to `ProposalsService.send(id)`
- 409 Conflict for invalid status transitions

### Frontend — `/proposals/[id]`

- **"Send to Client" button** — only visible when status is `borrador`
- **Confirmation dialog** — explains 20-min expiration, Cancel/Send actions, loading state
- **Public URL display** — shown automatically when status is `enviado` or `expirado`, with copy-to-clipboard button
- **Copy feedback** — shows "Copied!" for 2 seconds after copy, with fallback for older browsers
- **Error handling** — inline error display on send failure, allows retry
- **Expired detection** — inline note when `expiresAt` is past due
- **Read-only styling** — items section dimmed (opacity 70%) after send

### Boundary cases handled

| # | Case | Behavior |
|---|------|----------|
| 13.1 | Already `enviado` | Send button hidden, URL shown |
| 13.2 | `expirado` | Badge + URL shown, "Expired" note |
| 13.3 | Terminal status (`aceptado`, `rechazado`) | Badge shown, no actions, items dimmed |
| 13.4 | Network failure | Error displayed, kept editable, retry allowed |

---

## Files modified

| File | Change |
|------|--------|
| `apps/api/src/modules/proposals/proposals.service.ts` | Added `send()` method with validation + expiration |
| `apps/api/src/modules/proposals/proposals.controller.ts` | Added `PATCH /:id/send` route |
| `apps/web/app/(admin)/proposals/[id]/page.tsx` | Added send flow, confirmation, URL copy, read-only |

---

## Verification

- `pnpm typecheck` — ✅ 4/4 packages pass
- `pnpm build` — ✅ API + Web build successful
- `/proposals/[id]` page size: 2.4 kB → 3.26 kB
- No schema, shared types, or dependency changes
