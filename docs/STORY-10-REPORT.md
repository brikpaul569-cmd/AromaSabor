# Story 10 — Quantity Adjustment

> **Sprint:** 3
> **Status:** ✅ Complete
> **Date:** 2026-06-25

---

## What was built

### GuestCountInput

- **+ / − buttons**: Adjust guest count. − button disabled when count ≤ 1.
- **Numeric input**: Direct entry, min 1, clamped on blur/invalid. Decimals floored. Empty/NaN sanitized to 1.
- **Styling**: Consistent dark-theme with the existing UI (white/10 backgrounds, ring highlights).

### Zustand store extension

- **File:** `apps/web/stores/plate-store.ts`
- **New state:** `guestCount: number` (default `1`)
- **New action:** `setGuestCount(count: number)`
  - `count < 1` → clamped to `1`
  - `NaN` → `1`
  - Decimals → `Math.floor()`
- **Backward compatible** — no existing consumers broken; all tests pass unchanged.

### Pricing Summary

- **Live calculation** using `calculateQuotation()` from `@aromasabor/utils`
- **Per-plate cost**: sum of all selected item prices
- **Guest count**: displayed as multiplier (`× N`)
- **Subtotal**: per-plate × guest count
- **IVA (16%)**: half-up rounded
- **Total**: subtotal + IVA
- Updates reactively on selection change or guest count change

### State flow

```
User changes guest count (input / + / −)
  → setGuestCount(sanitized)
  → Zustand store updated
  → Pricing Summary re-renders with new calculateQuotation()
```

---

## Files modified

| File | Change |
|------|--------|
| `apps/web/stores/plate-store.ts` | Added `guestCount` state + `setGuestCount` action with validation |
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Added GuestCountInput UI, pricing summary, `calculateQuotation` import |

---

## Verification

- `pnpm typecheck` — ✅ 4/4 packages pass
- `pnpm build` — ✅ API + Web build successful
- `/menu/[slug]` page size: 3.37 kB → 4.05 kB (GuestCountInput + pricing summary)
- No backend changes needed
- Store API extended backward-compatibly
