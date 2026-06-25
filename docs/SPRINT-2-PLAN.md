# Sprint 2 — Plate Builder (View + Select + Visual)

> **Duration:** 2 weeks (Days 11–20)
> **Stories:** 6–8 from MVP-SCOPE-FINAL.md
> **Goal:** Client can view a published menu, select one item per category, and see a visual plate representation.

---

## Stories

| # | Story | Description | Status |
|---|-------|-------------|--------|
| 6 | **View menu** | Client opens a public menu URL. They see categories and items with names, weights, and prices. | ✅ |
| 7 | **Select items** | Client taps a category, sees available items, and selects one. Selected item appears in a visual plate area. | ✅ |
| 8 | **Visual plate** | As items are selected, they appear stacked in a centered plate view. Each item shows its name and portion weight. Basic CSS fade-in animation. | ✅ |

---

## What was built

### Schema changes

- `MenuItem`: added `weight?: number` (grams, optional) — displayed in both admin editor and public plate builder

### Files created

- `apps/web/stores/plate-store.ts` — Zustand store managing:
  - One selection per category (entrada, plato_fuerte, guarnicion, postre)
  - `selectItem`, `deselectItem`, `clearAll`, `selectedItems`, `isSelected`

### Files modified

- `apps/api/src/schemas/menu.schema.ts` — added `weight` to MenuItem
- `packages/shared-types/src/index.ts` — added `weight` to MenuItem interface
- `apps/web/app/(admin)/menus/[id]/page.tsx` — added weight field to add/edit item form, shows weight in item list
- `apps/web/app/(public)/menu/[slug]/page.tsx` — rebuilt as full Plate Builder:
  - Category accordion with item list (name, description, weight, price)
  - Click to select/deselect (max 1 per category, ✓ indicator)
  - Centered plate view showing stacked selected items with fade-in animation
  - Clear plate button
- `apps/web/tailwind.config.js` — added `fadeIn` keyframe animation

### Files unchanged (reserved for Sprint 3-4)

- `/prop/[token]` — Plate Builder integration with proposal flow (Sprint 5)
- Pricing engine integration (Sprint 3, Story 11)
- Replace/remove items (Sprint 3, Story 9)
- Quantity adjustment (Sprint 3, Story 10)

---

## Definition of Done

- [x] Client can open `/menu/:slug` and see items grouped by category with name, weight, price
- [x] Client can tap a category to expand it and see items
- [x] Client can tap an item to select it (one per category)
- [x] Selected items appear in a centered plate view with name + weight
- [x] CSS fade-in animation plays on each new selection
- [x] Client can deselect items and clear the plate
- [x] `pnpm typecheck` and `pnpm build` pass with no errors

---

## Next up

Sprint 3 — Plate Builder pt 2 (Stories 9–11): Replace/remove items, quantity adjustment (number of people), live pricing with IVA breakdown.
