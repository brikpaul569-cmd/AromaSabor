# MVP Backlog — AromaSabor

> **Priority:** P0 (blocker) → P3 (nice-to-have for MVP)
> **Estimation:** Fibonacci story points (1, 2, 3, 5, 8, 13, 21)

---

## P0 — Foundation (Sprint 0-1)

| ID | Story | Points | Dependencies |
|----|-------|--------|-------------|
| US-001 | Setup monorepo with Turborepo, ESLint, TypeScript strict | 3 | None |
| US-002 | Configure NestJS with MongoDB Atlas (Mongoose) | 2 | US-001 |
| US-003 | Configure Next.js 14 App Router with Tailwind CSS | 2 | US-001 |
| US-004 | Docker Compose for local development (MongoDB + API) | 2 | US-002 |
| US-005 | Deploy API to Railway, Web to Vercel | 3 | US-002, US-003 |
| US-006 | Setup shared-types package with core interfaces | 2 | US-001 |
| US-007 | **Auth:** Admin login with email/password + JWT (bcrypt) | 5 | US-002 |
| US-008 | **Menu CRUD:** Create menu with categories and items | 8 | US-002, US-007 |
| US-009 | **Menu CRUD:** Upload item images to Cloudinary (400×400 WebP) | 5 | US-008 |
| US-010 | **Menu CRUD:** Edit / soft-delete items | 3 | US-008 |
| US-011 | **Menu:** Public endpoint GET /menus/:slug (only available items) | 3 | US-008 |

**P0 Total:** 38 points

---

## P1 — Plate Builder + Proposal (Sprint 2-3)

| ID | Story | Points | Dependencies |
|----|-------|--------|-------------|
| US-012 | **Pricing Engine:** Pure function calculateQuotation with half-up rounding | 3 | US-006 |
| US-013 | **Plate Builder:** Layout with plate visual area + category carousel | 8 | US-003 |
| US-014 | **Plate Builder:** Item selector by category (image, name, weight, price) | 5 | US-013, US-009 |
| US-015 | **Plate Builder:** Add / remove / replace items with CSS animation | 8 | US-014 |
| US-016 | **Plate Builder:** Quantity adjustment (+ / -) per item | 3 | US-015 |
| US-017 | **Plate Builder:** Real-time price calculation (local pricing engine) | 3 | US-016, US-012 |
| US-018 | **Plate Builder:** Category validation (maxItems, required categories) | 5 | US-015 |
| US-019 | **Proposal:** Create proposal in DRAFT state (admin) | 5 | US-008, US-012 |
| US-020 | **Proposal:** Generate unique URL-safe token (UUID v4) | 2 | US-019 |
| US-021 | **Proposal:** Send proposal — DRAFT → SENT, start timer | 5 | US-020 |
| US-022 | **Proposal:** Public page /proposal/[token] with Plate Builder | 8 | US-021, US-013 |
| US-023 | **Proposal:** QR code generation per proposal | 3 | US-021 |

**P1 Total:** 58 points

---

## P2 — Negotiation + Expiration (Sprint 4)

| ID | Story | Points | Dependencies |
|----|-------|--------|-------------|
| US-024 | **Proposal:** Proposal expiration cron job (every 30s) | 5 | US-021 |
| US-025 | **Proposal:** Expired proposal screen (no content visible) | 3 | US-022 |
| US-026 | **Proposal:** Client edits proposal → MODIFIED_BY_CLIENT | 8 | US-022 |
| US-027 | **Proposal:** Chef edits proposal → MODIFIED_BY_CHEF | 5 | US-019 |
| US-028 | **Proposal:** Approval (APPROVED) and rejection (REJECTED) | 5 | US-026, US-027 |
| US-029 | **Proposal:** Edit history with diff view (editHistory) | 8 | US-026 |
| US-030 | **Notifications:** In-app notification model + CRUD | 5 | US-002 |
| US-031 | **Notifications:** Create notification on every status change | 5 | US-030, US-021 |
| US-032 | **Notifications:** Notification list UI for admin | 3 | US-031 |
| US-033 | **Notifications:** Mark as read | 2 | US-032 |
| US-034 | **Proposal:** Manual revocation by admin (EXPIRED) | 3 | US-021 |
| US-035 | **Proposal:** Admin extends proposal timer | 3 | US-021 |

**P2 Total:** 55 points

---

## P3 — Dashboard + Polish (Sprint 5)

| ID | Story | Points | Dependencies |
|----|-------|--------|-------------|
| US-036 | **Dashboard:** Proposal list with status filters | 5 | US-021 |
| US-037 | **Dashboard:** Proposal detail view with plate visual + price breakdown | 5 | US-022 |
| US-038 | **Dashboard:** Status badges with color coding | 2 | US-036 |
| US-039 | **Dashboard:** Generate QR from proposal detail | 2 | US-023 |
| US-040 | **Dashboard:** Edit proposal panel (chef edits from dashboard) | 8 | US-027 |
| US-041 | **Plate Builder:** Responsive layout (mobile-friendly) | 5 | US-013 |
| US-042 | **Plate Builder:** Loading skeleton + error states | 3 | US-013 |
| US-043 | **Proposal:** Configurable duration per proposal (admin) | 3 | US-021 |
| US-044 | **Proposal:** Status history timeline (statusHistory) | 5 | US-028 |
| US-045 | **Testing:** Property-based tests for pricing engine | 3 | US-012 |
| US-046 | **Testing:** Unit tests for state machine | 3 | US-028 |
| US-047 | **Testing:** Integration test for full negotiation flow | 5 | US-028 |

**P3 Total:** 49 points

---

## Summary

| Priority | Points | Sprints |
|----------|--------|---------|
| **P0** | 38 | Sprint 0-1 |
| **P1** | 58 | Sprint 2-3 |
| **P2** | 55 | Sprint 4 |
| **P3** | 49 | Sprint 5 |
| **Total** | **200** | **~11 weeks** |
