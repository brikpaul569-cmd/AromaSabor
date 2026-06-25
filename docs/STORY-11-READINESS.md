# Story 11 — Live Pricing: Readiness Assessment

> **Date:** 2026-06-25
> **Sprint:** 3
> **Status:** 🔍 Assessed (not started)

---

## 1. What Story 10 already implemented (indirectly)

During Story 10 (Quantity Adjustment), the following **Live Pricing** requirements were already delivered:

| Requirement | Status | Location |
|-------------|--------|----------|
| Price per plate (sum of selected items × 1) | ✅ | `page.tsx:164-167` |
| Subtotal (price per plate × guest count) | ✅ | `page.tsx:179-182` — via `calculateQuotation()` |
| IVA 16% (half-up rounding) | ✅ | `page.tsx:183-186` — via `calculateQuotation()` |
| Total (subtotal + IVA) | ✅ | `page.tsx:187-190` — via `calculateQuotation()` |
| Instant updates on selection change | ✅ | Zustand reactivity — pricing re-renders on any `selections` change |
| Instant updates on guest count change | ✅ | Zustand reactivity — pricing re-renders on `guestCount` change |
| Empty state → all $0 | ✅ | `calculateQuotation([])` returns zeros |
| Uses `calculateQuotation()` from `@aromasabor/utils` | ✅ | Imported at `page.tsx:10` |
| Locale `es-CO` for formatting | ✅ | `formatPrice()` at `page.tsx:38` |

**Result:** ~70% of Story 11's functionality is already live.

---

## 2. What is missing

### 2.1. Category breakdown ✦ **core gap**

The current pricing summary is a **flat block** — it shows per-plate total, guest count, subtotal, IVA, and total. It does NOT show individual category contributions.

**SPRINT-3-PLAN.md (Story 11 DoD):**
> - [ ] Muestra: **Breakdown por categoría** (subtotal por category)
> - [ ] Muestra: **Price per plate** ← ✅ done, but per-category version missing

**Expected UX:**
```
Breakdown                  Per plate      Total (×10)
─────────────────────────────────────────────────────
Entrada                     $15,000        $150,000
Plato Fuerte                $25,000        $250,000
Guarnición                  $8,000          $80,000
Postre                      $10,000        $100,000
─────────────────────────────────────────────────────
Per plate subtotal          $58,000
Guest count                                    × 10
Subtotal                                   $580,000
IVA (16%)                                   $92,800
Total                                       $672,800
```

### 2.2. No reusable component

The pricing summary is **inline JSX** inside `page.tsx:162-194`. It cannot be imported by the proposal page (`/prop/[token]`) in Sprint 5.

**SPRINT-3-PLAN.md:** "Crear `PricingBreakdown` en `apps/web/components/PricingBreakdown.tsx`"

### 2.3. Per-category line totals at ×1 (price per plate)

The current "Per plate" line shows the sum of all selected items. Story 11 expects this to also be visible **per category** so the user can see which categories contribute what to the total.

---

## 3. Components that must be modified

| File | Change | Type |
|------|--------|------|
| `apps/web/components/PricingBreakdown.tsx` | **CREATE** — extract pricing summary into reusable component with category breakdown rows | New |
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Replace inline pricing JSX with `<PricingBreakdown>` import; minor cleanup | Modify |
| `docs/STORY-11-REPORT.md` | Create after implementation | New (doc) |
| `docs/PROJECT-STATUS.md` | Mark Story 11 ✅, update Sprint 3 status | Modify |
| `docs/ENGRAM-MEMORY.md` | Add session record | Modify |

### No changes needed

| Area | Reason |
|------|--------|
| API (NestJS) | No new endpoints |
| Mongoose schemas | No data changes |
| Shared types | No new types |
| `plate-store.ts` | Already has all state needed: `selections` + `guestCount` |
| `pricing.ts` | Already correct (double-rounding fixed in Story 9) |
| `package.json` | `@aromasabor/utils` already linked (Story 9) |
| GuestCountInput | Already functional (Story 10) |

---

## 4. Effort assessment

| Aspect | Assessment |
|--------|-----------|
| **Scope** | 1 new component (`PricingBreakdown`) + 1 file modification |
| **Estimated lines** | ~70 lines (component) + ~10 lines (page integration) |
| **Backend work** | **None** |
| **Store work** | **None** |
| **Pricing engine work** | **None** |
| **Risk** | Very low — purely presentational, no data model changes |
| **Effort** | **Minor** — can be completed in a single session |

### What the component does

```
PricingBreakdown(selectedItems, guestCount, formatPrice)
  │
  ├─ Render category rows (only categories with selected items)
  │     ├─ Category label
  │     ├─ Item name
  │     ├─ Per-plate category subtotal (price × 1)
  │     └─ Total category line (price × guestCount)
  │
  ├─ Render summary rows
  │     ├─ Per-plate subtotal (sum of all categories at ×1)
  │     ├─ Guest count multiplier
  │     ├─ Subtotal (via calculateQuotation)
  │     ├─ IVA 16% (via calculateQuotation)
  │     └─ Total (via calculateQuotation)
  │
  └─ Empty state: all zeros
```

---

## 5. Conclusion

**Story 11 is ~70% complete due to Story 10 overlap.** The remaining work is:

1. **Extract** the inline pricing summary into `PricingBreakdown.tsx` component
2. **Add** per-category breakdown rows showing each category's contribution
3. **Integrate** the component back into the page

This is **minor work** — no backend, store, or pricing engine changes. Can be closed in a single implementation pass.

**Not started yet.** Awaiting approval.
