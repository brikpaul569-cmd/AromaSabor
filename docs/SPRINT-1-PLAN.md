# Sprint 1 — Auth + Menu CRUD

> **Duration:** 2 weeks (Days 1–10)
> **Stories:** 1–5 from MVP-SCOPE-FINAL.md
> **Goal:** Admin can log in and manage menus (categories + items)

---

## Stories

| # | Story | Description | Status |
|---|-------|-------------|--------|
| 1 | **Admin login** | Admin registers and logs in with email + password. JWT stored in httpOnly cookie. Protected admin layout. | ✅ |
| 2 | **Create menu** | Admin creates a menu with a name and description. Menu is saved with a unique slug. | ✅ |
| 3 | **Manage categories** | Admin assigns a category label (entrada, plato_fuerte, guarnicion, postre) to menu items. | ✅ |
| 4 | **Manage items** | Admin adds items to a menu. Each item has: name, description, category, price. Items can be removed from the menu. | ✅ |
| 5 | **Publish menu** | Admin marks a menu as active. It becomes accessible via public URL at `/menu/:slug`. | ✅ |

---

## Dependencies

- **External:** None (MongoDB can run locally via Docker Compose)
- **Internal:** None (Sprint 0 scaffold is complete)
- **Blocking:** `pnpm install` and `.env` creation must be done first

---

## Implementation Order

### Week 1 — Auth (Stories 1)

| Day | Focus | Files | What |
|-----|-------|-------|------|
| 1 | Setup + Admin model | `.env`, `pnpm install`, `apps/api/src/schemas/admin.schema.ts` | Create `.env` from `.env.example`, run `pnpm install`, verify `pnpm dev` starts. Admin schema already exists — verify it works with MongoDB. |
| 2 | Login endpoint | `apps/api/src/modules/auth/auth.service.ts`, `auth.controller.ts` | Implement `POST /api/auth/login` — validate credentials with bcrypt, sign JWT, set httpOnly cookie. Auth service/controller already exist — wire them up. |
| 3 | Guards + protected routes | `apps/api/src/common/guards/jwt-auth.guard.ts`, `auth/jwt.strategy.ts` | Ensure `JwtAuthGuard` blocks unauthenticated requests. Verify cookie extraction. |
| 4 | Login UI | `apps/web/app/(admin)/login/page.tsx` | Build login form with email + password, call `/api/auth/login`, store token in cookie, redirect to dashboard. |
| 5 | Protected admin layout | `apps/web/app/(admin)/layout.tsx` (new), `apps/web/lib/api.ts` (new) | Create admin layout that checks for JWT on mount, redirects to `/login` if missing. Create `api.ts` with fetch wrapper that includes credentials. |

### Week 2 — Menu CRUD (Stories 2–5)

| Day | Focus | Files | Status |
|-----|-------|-------|--------|
| 6 | Menu API — Create + List | `apps/api/src/modules/menus/menus.controller.ts`, `menus.service.ts` | ✅ |
| 7 | Menu API — Items CRUD | `apps/api/src/modules/menus/menus.controller.ts`, `menus.service.ts` | ✅ |
| 8 | Menu UI — List + Create | `apps/web/app/(admin)/menus/page.tsx`, `apps/web/app/(admin)/menus/new/page.tsx` | ✅ |
| 9 | Menu UI — Edit + Items | `apps/web/app/(admin)/menus/[id]/page.tsx` | ✅ |
| 10 | Public menu page + polish | `apps/web/app/(public)/menu/[slug]/page.tsx` | ✅ |

---

## New files (Sprint 1)

- `apps/web/app/(admin)/layout.tsx` — JWT check + redirect (Story 1) ✅
- `apps/web/lib/api.ts` — `fetch` wrapper with base URL, credentials, error handling (Story 1) ✅
- `apps/web/app/(admin)/menus/new/page.tsx` — Create menu form (Story 2) ✅
- `apps/web/app/(admin)/menus/[id]/page.tsx` — Menu edit page with item management (Stories 3-4) ✅
- `apps/api/src/scripts/seed.ts` (optional) — Seed script to create initial admin 🔲

---

## Definition of Done

- [x] Admin can log in (email + password) and is redirected to dashboard
- [x] Admin can create a menu with name + description (slug auto-generated)
- [x] Admin can add items to a menu (name, description, category, price)
- [x] Admin can remove items from a menu
- [x] Admin can edit existing items in a menu
- [x] Items are grouped by category (entrada, plato_fuerte, guarnicion, postre)
- [x] Menu is accessible at `/menu/:slug` without authentication
- [x] JWT is stored in httpOnly cookie, protected routes redirect to login
- [x] `pnpm lint` and `pnpm typecheck` pass with no errors

---

## Existing code that supports Sprint 1

- **Admin schema** (`apps/api/src/schemas/admin.schema.ts`) — complete
- **Menu schema** (`apps/api/src/schemas/menu.schema.ts`) — complete (items as embedded MenuItem[])
- **AuthModule** (`apps/api/src/modules/auth/`) — controller, service, JWT strategy already scaffolded
- **MenusModule** (`apps/api/src/modules/menus/`) — controller, service already scaffolded
- **JwtAuthGuard** (`apps/api/src/common/guards/jwt-auth.guard.ts`) — ready
- **AllExceptionsFilter** (`apps/api/src/common/filters/all-exceptions.filter.ts`) — ready
- **Shared types** (`packages/shared-types/src/index.ts`) — Admin, Menu, MenuItem, LoginRequest, LoginResponse
- **Web login page** (`apps/web/app/(admin)/login/page.tsx`) — base UI scaffolded
- **Web menu pages** (`apps/web/app/(admin)/menus/page.tsx`, `apps/web/app/(public)/menu/[slug]/page.tsx`) — stubs ready
