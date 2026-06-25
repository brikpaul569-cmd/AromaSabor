# Sprint 3 — Closure Report

> **Duration:** 2 weeks (2026-06-11 → 2026-06-25)
> **Stories:** 9, 10, 11
> **Status:** ✅ Complete

---

## Stories completed

| Story | Description | Status | Report |
|-------|-------------|--------|--------|
| 9 | Replace and Remove | ✅ | `docs/STORY-9-REPORT.md` |
| 10 | Quantity Adjustment (guest count) | ✅ | `docs/STORY-10-REPORT.md` |
| 11 | Live Pricing with IVA breakdown | ✅ | `docs/STORY-11-REPORT.md` |

### Summary

The Plate Builder is now fully functional for MVP:

- **Select/deselect** items per category (Sprint 2)
- **Replace/remove** items directly from the plate visual (Sprint 3, Story 9)
- **Guest count** adjustment with +/− input (Sprint 3, Story 10)
- **Live pricing** with category breakdown, subtotal, IVA, and total (Sprint 3, Story 11)

---

## Files created in Sprint 3

| File | Story |
|------|-------|
| `apps/web/components/PlateView.tsx` | 9 |
| `apps/web/components/PlateItemPopover.tsx` | 9 |
| `apps/web/components/ReplaceSelector.tsx` | 9 |
| `apps/web/components/PricingBreakdown.tsx` | 11 |
| `docs/STORY-9-REPORT.md` | 9 |
| `docs/STORY-10-REPORT.md` | 10 |
| `docs/STORY-11-REPORT.md` | 11 |
| `docs/SPRINT-3-CLOSURE.md` | — |

## Files modified in Sprint 3

| File | Story |
|------|-------|
| `apps/web/stores/plate-store.ts` | 10 — added `guestCount`, `setGuestCount` |
| `apps/web/app/(public)/menu/[slug]/page.tsx` | 9, 10, 11 — all three stories |
| `apps/web/package.json` | 9 — added `@aromasabor/utils` dependency |
| `packages/utils/src/pricing.ts` | 9 — fixed double-rounding in `total` |
| `docs/PROJECT-STATUS.md` | 9, 10, 11 — updated each |

---

## Verification

- `pnpm typecheck` — ✅ 4/4 packages pass (all sprints)
- `pnpm build` — ✅ API + Web build successful (all sprints)
- `/menu/[slug]` page size progression: 2.68 kB (S2) → 3.37 kB (S9) → 4.05 kB (S10) → 4.17 kB (S11)

---

## Technical debt remaining

| # | Item | Location | Priority | Notes |
|---|------|----------|----------|-------|
| D1 | **Locale `es-MX` in admin menu editor** | `apps/web/app/(admin)/menus/[id]/page.tsx:35` | Low | `formatPrice()` uses `es-MX` instead of `es-CO`. Public page was fixed in Story 9, admin page was not. |
| D2 | **Categories hardcoded** | Multiple files | Low | 4 categories (`entrada`, `plato_fuerte`, `guarnicion`, `postre`) are hardcoded in components and UI. Making them dynamic would require schema + store + UI changes across many files. Out of MVP scope. |
| D3 | **No image upload** | Menu item form | Low | MVP uses paste URL only (no Cloudinary). Documented in MVP decisions. |
| D4 | **No automated tests** | Entire project | Low | Manual testing only per MVP decision. Tests deferred to post-MVP. |
| D5 | **No loading skeleton** | Plate builder page | Low | Simple "Loading..." text. Acceptable for MVP. |
| D6 | **No error boundaries** | Public menu page | Low | API error shows "Menu not found". Acceptable for MVP. |

### Debt D1 is the only actionable item before Sprint 4

The `es-MX` locale in the admin menu editor is a 1-line fix. All other debt items are accepted MVP tradeoffs.

---

## Preparation for Sprint 4

### Stories 12–13 (Proposals)

Sprint 4 covers:
- **Story 12** — Create proposal (chef selects menu, pre-fills items, sets client/event info, saves as DRAFT)
- **Story 13** — Send proposal (status → SENT, generates UUID token, starts 20 min timer)

### What Sprint 3 already provides for Sprint 4

| Asset | Ready for |
|-------|-----------|
| `calculateQuotation()` | Proposal quotation calculation |
| `PricingBreakdown` component | Proposal pricing display (client view) |
| `PlateView` component | Proposal plate visual (client view) |
| `guestCount` in store | Proposal `guestCount` field |
| Zustand store pattern | Proposal item management |
| Pricing engine invariants | Database-level quotation storage |

### What Sprint 4 needs to build

- `ProposalsModule` in NestJS (controller + service + routes)
- `Proposal` Mongoose schema (already defined in Sprint 0, verify completeness)
- Web: proposal creation form (admin)
- Web: proposal list in dashboard
- Token generation (UUID v4)
- Status management (`borrador` → `enviado`)
- Expiration logic (20 min timer on send)

### No blockers

- All Sprint 4 work is independent of Sprint 3 changes
- Pricing engine is stable and tested
- Plate Builder components are reusable
- Store architecture is proven
