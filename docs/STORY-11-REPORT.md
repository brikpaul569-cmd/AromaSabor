# Story 11 — Live Pricing

> **Sprint:** 3
> **Status:** ✅ Complete
> **Date:** 2026-06-25

---

## What was built

### PricingBreakdown component

- **File:** `apps/web/components/PricingBreakdown.tsx`
- **Props:** `items: MenuItem[]`, `guestCount: number`
- **Internal calculation:**
  - Per-category breakdown (only categories with selected items)
  - Price per plate (sum of all selected items × 1)
  - Subtotal, IVA (16%), and Total via `calculateQuotation()` from `@aromasabor/utils`

### Category breakdown

Each category with a selected item is displayed as a row:

```
Entrada              $15,000
Plato Fuerte         $25,000
Guarnición           $8,000
Postre               $10,000
─────────────────────────────────
Price per plate      $58,000
Number of people     × 10
─────────────────────────────────
Subtotal             $580,000
IVA (16%)            $92,800
Total                $672,800
```

### Instant updates

The component re-renders reactively whenever:
- An item is selected/deselected (Zustand `selections` change)
- An item is replaced via `ReplaceSelector`
- `guestCount` changes (Zustand `guestCount` change)

### Inline pricing replaced

The inline pricing JSX previously in `page.tsx:162-194` was replaced with a single `<PricingBreakdown>` component call. The page imports it from `@/components/PricingBreakdown`.

---

## Files modified

| File | Change |
|------|--------|
| `apps/web/components/PricingBreakdown.tsx` | **CREATED** — reusable pricing component with category breakdown |
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Replaced inline pricing block with `<PricingBreakdown>`, removed `calculateQuotation` import |

---

## Verification

- `pnpm typecheck` — ✅ 4/4 packages pass
- `pnpm build` — ✅ API + Web build successful
- `/menu/[slug]` page size: 4.05 kB → 4.17 kB (PricingBreakdown component)
- No backend, store, pricing engine, or schema changes
- Component is reusable: can be imported by `/prop/[token]` in Sprint 5
