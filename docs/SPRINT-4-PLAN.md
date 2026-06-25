# Sprint 4 Plan — Proposals (Create + Send)

> **Duration:** 1 week
> **Stories:** 12, 13
> **Dependencies:** Sprint 3 complete
> **Goal:** Chef creates a proposal as DRAFT from a published menu, then sends it generating a unique token URL with a 20-minute expiration timer.

---

## 1. Codebase state before Sprint 4

### Backend — already exists (Sprint 0)

| Artifact | File | Status |
|----------|------|--------|
| Proposal Mongoose schema | `apps/api/src/schemas/proposal.schema.ts` | ✅ Full: `ProposalItem`, `EditHistoryEntry` embedded, all indexes |
| ProposalsModule | `apps/api/src/modules/proposals/proposals.module.ts` | ✅ Imported in `AppModule` |
| ProposalsService (CRUD) | `apps/api/src/modules/proposals/proposals.service.ts` | ✅ `create()`, `findAll()`, `findByToken()`, `update()`, `remove()` |
| ProposalsController | `apps/api/src/modules/proposals/proposals.controller.ts` | ✅ `POST /`, `GET /`, `GET /:token`, `PATCH /:id`, `DELETE /:id` |
| Token generation | `proposals.service.ts:18` | ✅ UUID v4 on create |
| Notification on create | `proposals.service.ts:21-26` | ✅ Creates `proposal_created` |

### Backend — gaps to close

| Gap | Impact | Sprint 4 action |
|-----|--------|----------------|
| `create()` ignores authenticated user | Proposal has no owner, `createdBy` empty | Add `@CurrentUser()` + pass `userId` to service |
| Controller uses `body: any` | No validation, malformed data possible | Add DTOs with `class-validator` |
| `quotation` not calculated | Stored as 0 | Call `calculateQuotation()` before save |
| No `send` endpoint | Story 13 blocked | New `PATCH /:id/send` route |
| No expiration logic | `expiresAt` never set | Set `expiresAt = now + 20min` on send |
| Admin can't fetch by MongoDB `_id` | No admin detail page | New `GET /id/:id` route |

### Frontend — gaps to close

| Page | Status | Sprint 4 action |
|------|--------|----------------|
| `/proposals` | Placeholder text | Replace with proposal list table |
| `/proposals/new` | Does not exist | Create proposal form |
| `/proposals/[id]` | Does not exist | Proposal detail + Send button |
| `/dashboard` | "Proposals will appear here" | Show recent proposals count/list |

---

## 2. Story 12 — Create Proposal

### 2.1 Chef → Proposal flow

```
1. Chef navigates to /proposals
2. Clicks "New Proposal"
3. Form loads published menus via GET /api/menus
4. Chef selects a menu → items load with pre-checked boxes
5. Chef fills: client name (req), event date (req),
   guest count (default 1), notes (opt)
6. Live preview: PlateView + PricingBreakdown updates reactively
7. Clicks "Save as Draft"
8. POST /api/proposals with CreateProposalDto
9. Server: validates DTO, sets createdBy from JWT,
   calculates quotation, generates token, saves
10. Redirect to /proposals/:id
```

### 2.2 APIs

| Method | Route | Auth | Body | Returns |
|--------|-------|------|------|---------|
| `POST` | `/api/proposals` | JWT | `CreateProposalDto` | `Proposal` |
| `GET` | `/api/menus` (exists) | No | — | `Menu[]` (for dropdown) |

### 2.3 DTOs

File: `apps/api/src/modules/proposals/dto/create-proposal.dto.ts`

```typescript
class CreateProposalItemDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsIn(['entrada','plato_fuerte','guarnicion','postre']) category: string;
  @Min(0) @IsNumber() price: number;
  @Min(1) @IsNumber() quantity: number;
}

class CreateProposalDto {
  @IsMongoId() menuId: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateProposalItemDto)
  items: CreateProposalItemDto[];
  @IsString() @IsNotEmpty() clientName: string;
  @IsString() @IsNotEmpty() eventDate: string;
  @Min(1) @IsNumber() guestCount: number;
  @IsOptional() @IsString() notes?: string;
}
```

### 2.4 Schemas involved

Only `Proposal` — already fully defined in sprint 0. No schema changes.

### 2.5 Frontend pages

| File | Action |
|------|--------|
| `apps/web/app/(admin)/proposals/page.tsx` | **MODIFY** — list table with status badges |
| `apps/web/app/(admin)/proposals/new/page.tsx` | **CREATE** — form with menu selector, items, preview |
| `apps/web/app/(admin)/proposals/[id]/page.tsx` | **CREATE** — detail view (shared by Story 12 + 13) |
| `apps/web/app/(admin)/dashboard/page.tsx` | **MODIFY** — recent proposals summary |

### 2.6 Boundary cases

| # | Case | Behavior |
|---|------|----------|
| 12.1 | Menu has 0 items | Block save. Show "Menu has no items." |
| 12.2 | No items selected | Disable save. Show "Select at least one item." |
| 12.3 | Client name empty | Inline validation, block save |
| 12.4 | Guest count < 1 | Clamp to 1 (same pattern as Story 10) |
| 12.5 | Double-click save | Disable button on first click, loading state |

---

## 3. Story 13 — Send Proposal

### 3.1 Send flow

```
1. Chef on /proposals/:id (proposal in 'borrador')
2. Clicks "Send to Client"
3. Confirmation dialog: "Start the 20-minute expiration?"
4. PATCH /api/proposals/:id/send (no body)
5. Server:
   a. Validates status === 'borrador' (else 409)
   b. status → 'enviado'
   c. expiresAt → now + 20 min
   d. Creates notification
6. Frontend:
   a. Shows public URL: /prop/{token}
   b. "Copy link" button
   c. Freezes editing (read-only mode)
```

### 3.2 APIs

| Method | Route | Auth | Body | Returns |
|--------|-------|------|------|---------|
| `PATCH` | `/api/proposals/:id/send` | JWT | — | `Proposal` |
| `GET` | `/api/proposals/id/:id` | JWT | — | `Proposal` (admin detail) |

### 3.3 DTOs

None. Send is parameterless.

### 3.4 State machine (Sprint 4 scope)

```
borrador ──send──► enviado

All other transitions (modificado_por_cliente, aceptado, etc.) blocked server-side.
Attempting any other transition → HTTP 409.
```

### 3.5 Frontend pages

Same as Story 12 — `/proposals/[id]` page adds:
- "Send to Client" button (only when `borrador`)
- Confirmation modal
- Public URL display + copy link (only when `enviado`)
- Read-only toggle (editing disabled after send)

### 3.6 Boundary cases

| # | Case | Behavior |
|---|------|----------|
| 13.1 | Already `enviado` | Hide Send button, show URL + "Already sent" |
| 13.2 | `expirado` | Show "Expired" badge, no actions |
| 13.3 | Terminal status (`aceptado`, `rechazado`) | Show historical badge, no actions |
| 13.4 | Network failure on send | Error toast, keep editable, allow retry |

---

## 4. Notification types

| Type | Trigger | Message |
|------|---------|---------|
| `proposal_created` | Save DRAFT | `"Proposal for {name} created"` |
| `proposal_updated` | Send to client | `"Proposal for {name} sent to client"` |

No new notification types needed. Use existing `proposal_updated` with a clear message.

---

## 5. Risks

| # | Risk | Mitigation |
|---|------|------------|
| R1 | `body: any` in controller → malformed data | Add DTOs with `class-validator` before first proposal write |
| R2 | `createdBy` not set → orphan proposals | Add `@CurrentUser()` to `POST /` handler |
| R3 | `quotation: 0` on created proposals | Call `calculateQuotation()` before save |
| R4 | Double-send → double notification | Idempotent: second call returns 409 Conflict |
| R5 | Route conflict `/:token` vs `/:id` | Use `/id/:id` for admin detail, keep `/:token` for public |

---

## 6. Backend implementation plan

### Day 1 — DTOs + Service refactor

| File | Change |
|------|--------|
| `apps/api/src/modules/proposals/dto/create-proposal.dto.ts` | **CREATE** — `CreateProposalItemDto` + `CreateProposalDto` |
| `apps/api/src/modules/proposals/proposals.service.ts` | **MODIFY** — `create()`: add `userId` param, call `calculateQuotation()`, store `quotation` |
| `apps/api/src/modules/proposals/proposals.controller.ts` | **MODIFY** — `create()`: add `@CurrentUser()`, use DTO body |

### Day 2 — Send endpoint

| File | Change |
|------|--------|
| `apps/api/src/modules/proposals/proposals.service.ts` | **MODIFY** — add `send(id)` method: validate status, set `enviado` + `expiresAt`, save |
| `apps/api/src/modules/proposals/proposals.controller.ts` | **MODIFY** — add `PATCH /:id/send` route |
| `apps/api/src/modules/proposals/proposals.service.ts` | **MODIFY** — add `findById(id)` method (by mongo `_id`) |
| `apps/api/src/modules/proposals/proposals.controller.ts` | **MODIFY** — add `GET /id/:id` route |

### Day 3 — Frontend: proposal list + dashboard

| File | Change |
|------|--------|
| `apps/web/app/(admin)/proposals/page.tsx` | **MODIFY** — fetch proposals, render table/cards with status badges |
| `apps/web/app/(admin)/dashboard/page.tsx` | **MODIFY** — fetch recent proposals, show count + list |

### Day 4 — Frontend: create form

| File | Change |
|------|--------|
| `apps/web/app/(admin)/proposals/new/page.tsx` | **CREATE** — menu selector, items with checkboxes, client/event/guest fields, preview, save button |
| `apps/web/app/(admin)/layout.tsx` | **VERIFY** — nav link to `/proposals` exists (already does) |

### Day 5 — Frontend: detail + send + polish

| File | Change |
|------|--------|
| `apps/web/app/(admin)/proposals/[id]/page.tsx` | **CREATE** — detail view with Send button, confirmation, URL display, read-only mode |
| Verify E2E: create → list → detail → send → URL shown | |
| `pnpm typecheck && pnpm build` | ✅ |

---

## 7. No changes needed

| Area | Reason |
|------|--------|
| Mongoose schemas | `Proposal` already fully defined in Sprint 0 |
| Shared types | `Proposal`, `ProposalItem`, `ProposalStatus` already defined |
| Pricing engine | `calculateQuotation()` stable and tested |
| Plate Builder components | `PlateView`, `PricingBreakdown` reusable as-is |
| Zustand store | Plate builder state is for public page, not admin flow |
| `package.json` | No new dependencies needed |
| Docker / CI | No infra changes |

---

## 8. Definition of Done

### Story 12 — Create Proposal
- [ ] `POST /api/proposals` accepts `CreateProposalDto` with validation
- [ ] Server stores `createdBy` from JWT
- [ ] Server calculates `quotation` via `calculateQuotation()` before save
- [ ] Server auto-generates UUID token
- [ ] Status defaults to `borrador`
- [ ] Frontend: `/proposals/new` form with menu selector, items, client/event/guest fields, preview
- [ ] Frontend: validation blocks save if required fields missing
- [ ] Frontend: redirects to `/proposals/:id` after save
- [ ] `/proposals` list page shows all proposals with status badges
- [ ] Dashboard shows recent proposals
- [ ] `pnpm typecheck && pnpm build` passes

### Story 13 — Send Proposal
- [ ] `PATCH /api/proposals/:id/send` changes status to `enviado`
- [ ] Server sets `expiresAt = now + 20 min`
- [ ] Invalid status transitions return HTTP 409
- [ ] Frontend: "Send to Client" button visible only for `borrador`
- [ ] Frontend: confirmation dialog before send
- [ ] Frontend: public URL displayed after send with copy button
- [ ] Frontend: proposal becomes read-only after send
- [ ] `pnpm typecheck && pnpm build` passes
