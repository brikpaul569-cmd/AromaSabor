# Story 9 — Replace and Remove

> **Sprint:** 3
> **Status:** ✅ Complete
> **Date:** 2026-06-25

---

## What was built

### Replace and Remove from plate visual

- **Tap plate layer → popover**: User taps any item layer in the `PlateView` component. A contextual popover (`PlateItemPopover`) appears with two options: **Remove** and **Replace**.
- **Remove**: Calls `deselectItem(category)` from the Zustand store. The item disappears from the plate. The category becomes empty.
- **Replace**: Opens a `ReplaceSelector` modal showing all other items in the same category (excluding the current item). Selecting one replaces the selection. The category still has exactly 1 item selected.
- **Boundary cases**:
  - Category with 1 item → "Replace" button is disabled (no alternatives)
  - Category with 0 items → impossible (the tapped item wouldn't exist)
  - Closing the replace selector without selecting → popover returns
  - Click outside popover → popover closes
  - Empty plate → no popover (the empty state renders instead)

### PlateView extracted to components/

The `PlateView` function was previously defined inline in `apps/web/app/(public)/menu/[slug]/page.tsx`. It is now a reusable component:

- **File:** `apps/web/components/PlateView.tsx`
- **Props:** `items: MenuItem[]`, `onItemTap?: (item: MenuItem) => void`
- **Changes from inline version:**
  - Each layer is now a `<button>` (was `<div>`) for accessibility
  - Added `onClick` handler → `onItemTap`
  - Added `hover:brightness-110` and `focus:ring-2` for interactivity
  - Maintains `animate-fadeIn`, z-index layering, color coding, and weight display

### New files created

| File | Purpose |
|------|---------|
| `apps/web/components/PlateView.tsx` | Reusable plate visual component with item tap support |
| `apps/web/components/PlateItemPopover.tsx` | Contextual popover: Remove / Replace options |
| `apps/web/components/ReplaceSelector.tsx` | Modal selector: other items in same category |

### Files modified

| File | Change |
|------|--------|
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Removed inline `PlateView`, `formatPrice`; added imports; Story 9 state (`activePlateItem`, `replaceCategory`), callbacks, popover/selector rendering |
| `apps/web/package.json` | Added `"@aromasabor/utils": "workspace:*"` |

### Deuda técnica corregida

- **`formatPrice` locale**: Cambiado de `es-MX` a `es-CO` (Colombia)

---

## State flow

```
User taps plate layer
  → setActivePlateItem(item)          # popover appears
  ├─ User taps "Remove"
  │   → deselectItem(category)
  │   → setActivePlateItem(null)       # popover closes, item gone
  │
  ├─ User taps "Replace"
  │   → setReplaceCategory(category)   # popover hidden, selector opens
  │   ├─ User selects new item
  │   │   → selectItem(newItem)
  │   │   → setReplaceCategory(null)
  │   │   → setActivePlateItem(null)   # selector closes, item replaced
  │   └─ User closes selector
  │       → setReplaceCategory(null)   # popover returns
  │
  └─ User clicks outside popover
      → setActivePlateItem(null)       # popover closes, no change
```

---

## Files

```
apps/web/
├── components/
│   ├── PlateView.tsx          (NEW — extracted)
│   ├── PlateItemPopover.tsx    (NEW)
│   └── ReplaceSelector.tsx     (NEW)
└── app/(public)/menu/[slug]/
    └── page.tsx               (MODIFIED — uses components + Story 9 logic)
```

---

## Verification

- `pnpm typecheck` — ✅ 4/4 packages pass
- `pnpm build` — ✅ API + Web build successful
- `/menu/[slug]` page size: 2.68 kB → 3.37 kB (new components)
- No backend changes needed
- Store API unchanged (uses existing `selectItem`, `deselectItem`, `clearAll`)
- Reusable: `PlateView` can be imported by `/prop/[token]` page in Sprint 5
