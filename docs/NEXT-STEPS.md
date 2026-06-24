# Next Steps — AromaSabor MVP

> **Current phase:** Sprint 1 / Story 1 (Admin Login) ✅ Complete
> **Next:** Stories 2–5 (Menu CRUD)

---

## Phase 1: Approved Scope ✅

All scope decisions confirmed. See `docs/MVP-SCOPE-FINAL.md`.

---

## Phase 2: Pre-Sprint 0 Setup ✅

- ✅ Monorepo scaffolded (Turborepo + pnpm workspaces + TypeScript strict)
- ✅ NestJS API with 4 modules + Mongoose schemas
- ✅ Next.js 15 Web with Tailwind + route groups
- ✅ Shared packages (shared-types + utils)
- ✅ Docker Compose (MongoDB 7 + API)
- ✅ CI workflow (GitHub Actions)
- ✅ `pnpm install` executed
- ✅ `.env` created
- ✅ `pnpm typecheck` passes all packages
- ✅ `pnpm build` passes all packages
- ❌ Git repo — not yet initialized

---

## Phase 3: Sprint 1 Progress

### Story 1 — Admin Login ✅ Complete

See `docs/STORY-1-REPORT.md` for full details.

**What was built:**
- `POST /api/auth/register` — admin registration with bcrypt
- `POST /api/auth/login` — JWT in httpOnly cookie
- `POST /api/auth/logout` — clear cookie
- `GET /api/auth/me` — JWT-guarded profile endpoint
- Login/Register UI with form validation, error handling, loading state
- Protected admin layout with redirect on 401

### Pending: Stories 2–5 (Menu CRUD)

| # | Story | Est. effort |
|---|-------|-------------|
| 2 | **Create menu** — Admin creates a menu with name + description, slug auto-generated | 1 day |
| 3 | **Manage categories** — Items assigned to one of 4 fixed categories (entrada, plato_fuerte, guarnicion, postre) | 0.5 day |
| 4 | **Manage items** — Add/remove items to menu (name, description, category, price) | 1.5 days |
| 5 | **Publish menu** — Menu accessible via public URL at `/menu/:slug` | 1 day |

**Implementation order:**
1. `POST /api/menus` + `GET /api/menus` + `GET /api/menus/:slug` (create, list, public view)
2. Menu list page + create form
3. Menu editor page (add/remove items with category + price)
4. Public menu page at `/menu/:slug`

---

## V2 Idea Capture (not for MVP)

| Idea | Sprint discovered | Why not now |
|------|-------------------|-------------|
| | | |
