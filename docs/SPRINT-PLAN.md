# Sprint Plan — AromaSabor MVP

> **Cadence:** 1 sprint = 1 week (5 working days)
> **Capacity:** ~4-5 effective hours/day per developer
> **Total:** 11 weeks to MVP V1.0

---

## Sprint 0 — Setup Infrastructure

**Duration:** 2 weeks
**Goal:** Working monorepo with deployable API + Web

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Monorepo | Initialize Turborepo, configure pnpm workspaces, TypeScript strict |
| 2 | API scaffold | NestJS project, modules folder structure, MongoDB connection |
| 3 | Web scaffold | Next.js 14 App Router, Tailwind CSS, shadcn/ui setup |
| 4 | Shared packages | Create shared-types, utils (pricing.ts stub) |
| 5 | Docker | Docker Compose: MongoDB + API, .env files |
| 6 | Deployment | Deploy API → Railway, Web → Vercel |
| 7 | CI/CD | GitHub Actions: lint + typecheck on PR |
| 8 | Dev seed | Seed script with sample menu data |
| 9 | Documentation | README, architecture diagram (Mermaid) |
| 10 | Buffer / catch-up | Fix setup issues, align tooling |

**Definition of Done:**
- [x] `pnpm dev` starts API + Web locally
- [x] API health endpoint returns 200
- [x] Web renders homepage
- [x] Deployed to Railway + Vercel

**US:** US-001 → US-006

---

## Sprint 1 — Auth + Menu CRUD

**Duration:** 2 weeks
**Goal:** Admin can log in and manage menus

### Week 1 — Auth

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Admin model | Create Admin schema, bcrypt password hashing |
| 2 | Login endpoint | POST /auth/login, JWT signing (24h expiry) |
| 3 | Guards | JwtAuthGuard, RolesGuard |
| 4 | Login UI | Next.js login page, token storage (httpOnly cookie) |
| 5 | Protected layout | (admin) route group, session check, redirect |

### Week 2 — Menu CRUD

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Menu schema | Menu, Category, Item embedded documents |
| 2 | Menu API | POST/GET/PATCH /menus, slug generation |
| 3 | Item API | POST/PATCH/DELETE /menus/:id/items, soft-delete |
| 4 | Image upload | Cloudinary integration, POST /menus/:id/image |
| 5 | Menu UI | Next.js menu list + editor pages |

**Definition of Done:**
- [x] Admin can register / log in
- [x] Admin can create, edit, delete menus
- [x] Admin can upload item images
- [x] Public GET /menus/:slug returns available items only

**US:** US-007 → US-011

---

## Sprint 2 — Visual Plate Composer

**Duration:** 3 weeks (highest risk)
**Goal:** Client can see a menu and build a plate visually

### Week 1 — Plate Layout + State

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Zustand store | usePlateStore: items, quantities, total |
| 2 | Plate visual component | SVG/CSS plate layout, item positioning |
| 3 | Category carousel | Horizontal scroll, active category state |
| 4 | Framer Motion | AnimatePresence for item add/remove |
| 5 | Item selector | Grid of item cards (image, name, weight, price) |

### Week 2 — Interactions + Pricing

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Add item flow | Select category → pick item → animate into plate |
| 2 | Remove item | Tap item → remove with animation → price update |
| 3 | Replace item | Tap → open alternatives → replace with animation |
| 4 | Quantity controls | +/- buttons per item, min 1, max = category maxItems |
| 5 | Pricing engine | Integrate calculateQuotation, live total display |

### Week 3 — Validation + Responsive

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Category validation | maxItems limit, required categories check |
| 2 | Price breakdown | Per-item cost, per-category subtotal |
| 3 | Responsive layout | Mobile: stack vertically, Tablet: side-by-side |
| 4 | Loading + error states | Skeleton loader, error boundary, retry |
| 5 | Polish | Animation timing, glassmorphism styling |

**Definition of Done:**
- [x] Client can browse menu categories
- [x] Client can add/remove/replace items visually
- [x] Plate updates with animation on every change
- [x] Total price updates in real time
- [x] Validation prevents exceeding category limits

**US:** US-012 → US-018

---

## Sprint 3 — Proposal Creation + Expiration

**Duration:** 2 weeks
**Goal:** Chef can create and send timed proposals

### Week 1 — Proposal API + Tokens

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Proposal schema | Proposal model with all fields |
| 2 | Create proposal | POST /proposals (DRAFT), pre-select items |
| 3 | Token generation | UUID v4, URL-safe, unique index |
| 4 | Send proposal | POST /proposals/:id/send → SENT, set expiresAt |
| 5 | QR generation | qrcode library, download PNG |

### Week 2 — Public Access + Expiration

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Public proposal page | GET /public/proposal/:token, validate token + expiry |
| 2 | Visual Plate Composer on public page | Embed Visual Plate Composer for client |
| 3 | Expiration cron | @Cron every 30s, update expired proposals |
| 4 | Expired screen | "This proposal has expired" — no content visible |
| 5 | Client viewed tracking | Status → ACTIVE on first open, start timer UI |

**Definition of Done:**
- [x] Chef creates and sends proposals with configurable duration
- [x] QR code generated per proposal
- [x] Client accesses proposal via token URL
- [x] Proposal auto-expires after configured time
- [x] Expired proposals show no content

**US:** US-019 → US-025

---

## Sprint 4 — Collaborative Negotiation

**Duration:** 2 weeks
**Goal:** Full negotiation cycle between chef and client

### Week 1 — Client Edits + Notifications

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Client edit endpoint | PATCH /public/proposal/:token → MODIFIED_BY_CLIENT |
| 2 | Client edit UI | Client can modify plate, reason field |
| 3 | Notification schema | Notification model + service |
| 4 | Notification on edit | Create notif: "Client modified proposal" |
| 5 | Chef notification UI | Notification list, unread badge |

### Week 2 — Chef Response + Approval

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Chef edit from dashboard | PATCH /proposals/:id → MODIFIED_BY_CHEF |
| 2 | Diff view | Highlight changed items between versions |
| 3 | Approval endpoint | POST .../approve → APPROVED, notif both |
| 4 | Rejection endpoint | POST .../reject → REJECTED, reason required |
| 5 | Edit history | editHistory storage, timeline display |

**Definition of Done:**
- [x] Client edits → chef notified
- [x] Chef edits → client notified
- [x] Either party can approve/reject
- [x] Edit history shows all changes with diff
- [x] Negotiation loop continues until approve/reject/expire

**US:** US-026 → US-035

---

## Sprint 5 — Dashboard + Polish

**Duration:** 1 week
**Goal:** Complete admin dashboard + MVP quality

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Dashboard list | Proposal list with status filters (pending/active/modified/approved/rejected/expired) |
| 2 | Proposal detail | Full detail view: plate visual, price, history, timeline |
| 3 | Chef edit panel | Edit Proposal inline from dashboard |
| 4 | Manual revoke + extend | Buttons to expire or extend timer |
| 5 | Testing + deploy | Property tests, integration tests, final deploy |

**Definition of Done:**
- [x] Dashboard shows all proposals with filters
- [x] Chef can edit proposals from dashboard
- [x] Chef can revoke or extend proposals
- [x] QR generated from detail view
- [x] All tests pass
- [x] Deployed and working end-to-end

**US:** US-036 → US-047

---

## Sprint Velocity Chart

```
Sprint 0  │ ████████░░ 8 pts  (setup)
Sprint 1  │ █████████████░ 13 pts (auth + menus)
Sprint 2  │ █████████████████████░░ 21 pts (Visual Plate Composer — highest risk)
Sprint 3  │ █████████████░░ 13 pts (proposal + expiration)
Sprint 4  │ █████████████░░ 13 pts (negotiation)
Sprint 5  │ ████████░░ 8 pts  (dashboard + polish)
           └────────────────────────────
Total     │ 76 pts → ~11 weeks
```

**Historical note:** Sprint 2 (21 pts) is intentionally oversized because the Visual Plate Composer is the highest-risk, highest-value component. If it overflows, steal days from Sprint 5 (lowest risk).
