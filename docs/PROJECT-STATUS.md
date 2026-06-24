# Project Status — AromaSabor

> **Date:** 2026-06-24
> **Phase:** Sprint 1 — Stories 1–4 (Auth + Menu CRUD) ✅
> **Developer:** Single senior/mid developer
> **Projected MVP:** 10 weeks

---

## 1. Executive Summary

AromaSabor is a web platform for banquet halls and caterers to collaboratively build and negotiate gastronomic proposals with clients.

**Core loop:**
1. Chef creates a menu (permanent, does not expire)
2. Chef creates a proposal from the menu and sends it to client
3. Client accesses via unique token URL or QR code
4. Client builds their plate visually using the Plate Builder
5. Chef and client negotiate by editing the proposal back and forth
6. Proposal auto-expires after 20 minutes (configurable in V2)
7. Either party approves or rejects — cycle ends

**Key differentiator:** Visual Plate Builder — client sees their plate assembled item by item with live pricing.

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
| 10 | Quantity adjustment | Plate Builder | S3 |
| 11 | Live pricing | Plate Builder | S3 |
| 12 | Create proposal | Proposals | S4 |
| 13 | Send proposal | Proposals | S4 |
| 14 | Client access | Proposals | S5 |
| 15 | Expiration | Proposals | S5 |
| 16 | QR code | Proposals | S5 |
| 17 | Client modifies | Negotiation | S6 |
| 18 | Chef modifies | Negotiation | S6 |
| 19 | Approve / Reject | Negotiation | S7 |
| 20 | In-app notifications | Negotiation | S7 |

---

## 4. Technology Stack (MVP)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
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
Sprint 1 (2 weeks) → Stories 1-5   (Auth + Menus)
Sprint 2 (2 weeks) → Stories 6-8   (Plate Builder pt 1: view + select + visual)
Sprint 3 (2 weeks) → Stories 9-11  (Plate Builder pt 2: replace, qty, pricing)
Sprint 4 (1 week)  → Stories 12-13 (Proposal creation + send)
Sprint 5 (1 week)  → Stories 14-16 (Client access + expiration + QR)
Sprint 6 (1 week)  → Stories 17-18 (Bidirectional editing)
Sprint 7 (1 week)  → Stories 19-20 (Approve/reject + notifications)
                      ─────────
                       10 weeks
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
| DOMAIN-MODEL.md | Includes cut fields (clientEmail, clientPhone, eventDate, durationMinutes, quantity) | ⚠️ **Pending update** — schemas in code match final model; doc is stale but non-blocking |
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

Sprint 1 continues: Stories 2–5 (Menu CRUD).

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

## 12. Sprint 1 Complete 🎉

Sprint 1 at MVP scope (Stories 1–5) is fully implemented:

- ✅ Admin login (register, login, logout, protected layout)
- ✅ Create menu (name, description, auto-slug)
- ✅ Manage categories (4 category labels)
- ✅ Manage items (add, edit, delete items with category + price)
- ✅ Publish menu (toggle active, public page at `/menu/:slug`)

### Next up: Sprint 2 — Proposals (Stories 6–9)

---

## 13. Risks (Final Assessment)

| # | Risk | Mitigation |
|---|------|------------|
| R1 | Plate Builder complexity for solo dev | Start with minimal CSS animations, skip Framer Motion if needed. Core value is visual selection, not the animation polish. |
| R2 | Expiration timer accuracy | Cron job every 30s is sufficient. Client-side countdown is cosmetic — server is source of truth. |
| R3 | Concurrent edits (chef + client) | Optimistic locking via `updatedAt`. Second writer gets 409 with the other's changes. |
| R4 | Token URL brute force | UUID v4 (122 bits entropy + rate limiting on /proposal/:token). |
| R5 | Single developer bus factor | Conventional commits, clean README, architecture docs. Worst case: another dev can pick up from docs. |
| R6 | Scope creep during development | Strict 20-story cap. Any new idea goes to V2 list. No exceptions. |

---

## 14. What Success Looks Like (MVP)

- Chef can log in, create menus, add items
- Client opens a link, sees a visual plate builder, builds a plate
- Chef sends a proposal with a 20-minute expiration
- Client edits the proposal, chef gets notified
- Chef edits back, client gets notified
- Someone approves or rejects
- Chef downloads a QR code for the proposal
- Expired proposals show nothing
- All notifications live inside the app
