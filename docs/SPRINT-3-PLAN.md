# Sprint 3 Plan — Plate Builder pt 2 (Replace, Quantity, Pricing)

> **Duration:** 2 weeks
> **Stories:** 9, 10, 11 from MVP-SCOPE-FINAL.md
> **Dependencies:** Sprint 2 (Stories 6–8) — complete
> **Goal:** Client can replace/remove items on the plate, adjust guest count, and see live pricing with IVA breakdown.

---

## 1. Story Specifications (from MVP-SCOPE-FINAL.md)

### Story 9 — Replace and Remove

> "Client taps an item in the plate view to remove it or replace it with another from the same category."

| Aspecto | Detalle |
|---------|---------|
| Trigger | Tap on plate visual layer |
| Acción A | Remove — deselect item, category becomes empty |
| Acción B | Replace — open category items, pick a different item |
| Estado actual | Solo se puede seleccionar/deseleccionar desde el acordeón |
| Corte MVP | Sin animaciones Reanimated (CSS transitions ok) |

### Story 10 — Quantity Adjustment

> "Client adjusts number of people (not portions per item). This updates the total price in real time."

| Aspecto | Detalle |
|---------|---------|
| Input | Número de comensales (guest count), no por-item |
| Rango | ≥ 1 |
| Display | +/- buttons o input numérico |
| Impacto | Multiplica el precio total |
| Corte MVP | Sin per-item quantity |

### Story 11 — Live Pricing

> "Price per plate and total price update instantly as items change. Shows a simple breakdown per category."

| Aspecto | Detalle |
|---------|---------|
| Price per plate | Suma de 1× cada item seleccionado |
| Total | Price per plate × guest count |
| IVA | 16% del total, half-up rounding |
| Breakdown | Subtotal por categoría (no por item) |
| Corte MVP | Sin price breakdown per item (solo category total) |

---

## 2. Arquitectura Propuesta

### Diagrama de flujo de datos

```
┌─────────────────────────────────────────────────────┐
│                  PublicMenuPage                      │
│  apps/web/app/(public)/menu/[slug]/page.tsx          │
│                                                       │
│  ┌─────────────────┐   ┌──────────────────────────┐  │
│  │   PlateView      │   │   CategoryAccordion      │  │
│  │   (visual)       │   │   (item list)            │  │
│  │   ↑ tap item     │   │   ↑ select/deselect      │  │
│  └────────┬─────────┘   └──────────┬───────────────┘  │
│           │                        │                    │
│           ▼                        ▼                    │
│  ┌────────────────────────────────────────────────┐   │
│  │            usePlateStore (Zustand)              │   │
│  │  ┌────────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │ selections │  │guestCount│  │ replace/   │  │   │
│  │  │ per cat    │  │(number)  │  │ remove     │  │   │
│  │  └────────────┘  └──────────┘  └────────────┘  │   │
│  └──────────────────┬─────────────────────────────┘   │
│                     │                                   │
│                     ▼                                   │
│  ┌────────────────────────────────────────────────┐   │
│  │          Pricing Display (NUEVO)                │   │
│  │  calculateQuotation(items × guestCount)         │   │
│  │  → pricePerPlate | subtotal | IVA | total      │   │
│  │  → breakdown por categoría                      │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────┐                                 │
│  │ GuestCountInput  │ (NUEVO)                          │
│  │ +/- buttons      │                                 │
│  └──────────────────┘                                 │
└─────────────────────────────────────────────────────┘
```

### Decisiones de arquitectura

| Decisión | Opción elegida | Razón |
|----------|---------------|-------|
| Replace/Remove UX | Popover/modal al tap en PlateView | MVP pide interacción directa desde el plato visual |
| Guest count en store | `guestCount` en Zustand | Estado compartido entre pricing y display |
| Cálculo de pricing | `calculateQuotation()` desde `@aromasabor/utils` | Single source of truth, zero-dependency pure function |
| Breakdown por categoría | Cálculo client-side (map/reduce) | El pricing engine es para totales; categorías son UI |
| Dependencia `@aromasabor/utils` | Agregar a `apps/web/package.json` | Sigue el patrón monorepo, evita duplicación |

---

## 3. Componentes Afectados

### Modificar

| Archivo | Cambio | Story |
|---------|--------|-------|
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Agregar: pricing display, guest count input, popover replace/remove en PlateView, datos de pricing en el layout | 9, 10, 11 |
| `apps/web/stores/plate-store.ts` | Agregar: `guestCount`, `setGuestCount`, `replaceItem` action | 9, 10 |
| `apps/web/package.json` | Agregar dependencia `@aromasabor/utils` (para `calculateQuotation`) | 11 |
| `apps/web/tailwind.config.js` | Posiblemente nuevas keyframes (slide-up, scale-in para popover) | 9 |

### Crear

| Archivo | Propósito | Story |
|---------|-----------|-------|
| `apps/web/components/PlateItemPopover.tsx` | Popover con opciones Remove / Replace al tap en una capa del plato | 9 |
| `apps/web/components/GuestCountInput.tsx` | Input +/- para número de comensales | 10 |
| `apps/web/components/PricingBreakdown.tsx` | Panel con price per plate, subtotal por categoría, IVA, total | 11 |
| `apps/web/components/ReplaceSelector.tsx` | Mini-lista de items de una categoría para reemplazar (modal o sheet) | 9 |

### No requiere cambios

| Archivo | Razón |
|---------|-------|
| `apps/api/*` | Sprint 3 es 100% frontend. No se necesitan nuevos endpoints. |
| `packages/shared-types/*` | No se necesitan nuevos tipos. |
| `packages/utils/src/pricing.ts` | La función es suficiente (ver sección 9). |

---

## 4. Store Zustand a Modificar

### Estado actual (`apps/web/stores/plate-store.ts`, 60 líneas)

```typescript
interface PlateStore {
  selections: Record<Category, PlateItem | null>;
  selectItem: (item: PlateItem) => void;
  deselectItem: (category: Category) => void;
  clearAll: () => void;
  selectedItems: () => PlateItem[];
  isSelected: (item: PlateItem) => boolean;
}
```

### Estado propuesto

```typescript
interface PlateStore {
  // ── State ──
  selections: Record<Category, PlateItem | null>;
  guestCount: number;                              // NUEVO — default 1

  // ── Actions ──
  selectItem: (item: PlateItem) => void;
  deselectItem: (category: Category) => void;
  replaceItem: (category: Category) => void;       // NUEVO — alias de select después de deselect, o abre UI
  clearAll: () => void;
  setGuestCount: (count: number) => void;          // NUEVO

  // ── Getters ──
  selectedItems: () => PlateItem[];
  isSelected: (item: PlateItem) => boolean;
}
```

### Detalle de nuevas funciones

| Función | Comportamiento |
|---------|---------------|
| `setGuestCount(count)` | `set({ guestCount: Math.max(1, count) })` — clamp a ≥ 1 |
| `replaceItem(category)` | No es una función del store en sí. La UX del popover llama a `deselectItem(category)` y luego abre `ReplaceSelector`. El store no necesita lógica adicional — `selectItem` ya sobrescribe. |

El store realmente no necesita un método `replaceItem`. La lógica es:
1. User taps plate layer → `PlateItemPopover` se abre
2. User elige "Remove" → `deselectItem(category)` del store
3. User elige "Replace" → `deselectItem(category)` + se abre `ReplaceSelector` con items de esa categoría
4. User selecciona nuevo item → `selectItem(item)` del store

---

## 5. APIs Necesarias

**Ninguna.** Sprint 3 es exclusivamente frontend.

| API existente | Uso en Sprint 3 |
|---------------|-----------------|
| `GET /api/menus/slug/:slug` | Ya se usa para cargar el menú. No cambia. |
| `POST /api/proposals` | No se usa en Sprint 3 (Sprint 4). |
| `PATCH /api/proposals/:id/items` | No se usa en Sprint 3 (Sprint 6). |

**Nota:** En el futuro (Sprint 4+), cuando se cree una propuesta desde el Plate Builder, los items seleccionados + guest count se enviarán al backend. Pero eso no es Sprint 3.

---

## 6. Riesgos Técnicos

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|:-----------:|:-------:|------------|
| R1 | **`calculateQuotation` usa `quantity` per-item, pero Story 10 usa guest count global.** La función acepta `{ price, quantity }[]`. Para usarla, pasar cada item con `quantity = guestCount`. Matemáticamente correcto: `Σ(price × guestCount) = guestCount × Σ(price)`. | Baja | Bajo | Validar con casos de prueba antes de integrar. |
| R2 | **`roundHalfUp` con `Number.EPSILON` puede dar falsos positivos en ciertos edge cases** (ej: 0.5 + 0.5 = 1.0 exact, pero EPSILON shifting podría romper). | Baja | Medio | Revisar si `Math.round(value * 100) / 100` sin EPSILON es más seguro. El dominio model dice "half-up to 2 decimals". |
| R3 | **PlateView inline impide reuso en `/prop/[token]`**. Si no se extrae ahora, en Sprint 5 habrá que refactorizar. | Media | Medio | Aprovechar Sprint 3 para extraer `PlateView` a `components/PlateView.tsx`. |
| R4 | **Categorías hardcoded** — el breakdown por categoría en Story 11 asume las 4 categorías fijas. Si en el futuro se hacen dinámicas, el breakdown UI también debe cambiar. | Alta (futuro) | Bajo (ahora) | Aceptar el riesgo ahora. Si se refactorizan categorías, el breakdown se refactoriza junto. |
| R5 | **Sin `@aromasabor/utils` en web `package.json`** — no se puede importar `calculateQuotation`. | Alta (ahora) | Alto | Agregar dependencia en `package.json`. Verificar que pnpm workspace la resuelva. |

---

## 7. Casos Límite

### Story 9 — Replace and Remove

| # | Caso | Comportamiento esperado |
|---|------|------------------------|
| 9.1 | Tap en plato vacío (sin items) | No pasa nada. No hay popover. |
| 9.2 | Remover el único item seleccionado | Plato vuelve a estado vacío ("Select items..."). |
| 9.3 | Remover item, luego seleccionar otro de misma categoría | Funciona normalmente — categoría queda null, luego se setea. |
| 9.4 | Replace de item por el MISMO item | El popover solo muestra items DIFERENTES al actual. O al seleccionar el mismo item, no hay cambio. |
| 9.5 | Categoría con 1 solo item, se hace Replace | No hay otros items para reemplazar. Opción "Replace" deshabilitada o no visible. Solo "Remove". |
| 9.6 | Categoría sin items (vacía desde admin) | No hay nada que reemplazar ni remover. |

### Story 10 — Quantity Adjustment

| # | Caso | Comportamiento esperado |
|---|------|------------------------|
| 10.1 | Guest count = 0 o negativo | Clamp a 1 (desde `setGuestCount`). |
| 10.2 | Guest count = 1 | Pricing muestra price per plate = total (sin multiplicar). |
| 10.3 | Guest count = 1000 (número grande) | Input acepta, pricing calcula. Sin límite superior (dominio: cantidad de invitados real). |
| 10.4 | Sin items seleccionados, guest count cambia | Pricing muestra todo en $0 (empty state). |
| 10.5 | Guest count cambia mientras se seleccionan/deseleccionan items | Pricing se actualiza en tiempo real (reactivo a ambos estados). |

### Story 11 — Live Pricing

| # | Caso | Comportamiento esperado |
|---|------|------------------------|
| 11.1 | Sin items seleccionados | `calculateQuotation([])` → `{ subtotal: 0, tax: 0, total: 0 }`. Mostrar $0. |
| 11.2 | 1 item seleccionado, guest count = 1 | Precio por plato = precio del item. Total = precio del item. IVA = 16%. |
| 11.3 | Items de diferentes categorías | Breakdown muestra subtotal por cada categoría con items seleccionados. |
| 11.4 | Items de UNA sola categoría | Breakdown muestra 1 categoría. Las demás no aparecen. |
| 11.5 | Precios con decimales (ej: $15.50) | `calculateQuotation` mantiene 2 decimales. IVA half-up rounding. |
| 11.6 | Item con precio = 0 (gratis) | Se incluye en breakdown con $0. |
| 11.7 | Guest count cambia, items no cambian | Solo total cambia, price per plate se mantiene igual. |
| 11.8 | Items cambian, guest count no cambia | Price per plate cambia, total se recalcula con mismo guest count. |

---

## 8. Definition of Done

### Story 9 — Replace and Remove

- [ ] Tap en una capa del `PlateView` abre un popover contextual (Remove / Replace)
- [ ] "Remove" deselecciona el item de esa categoría
- [ ] "Replace" abre un selector con los items disponibles de esa categoría
- [ ] Seleccionar un item diferente en el Replace lo asigna a esa categoría
- [ ] Replace no permite seleccionar el mismo item ya activo
- [ ] Si la categoría tiene 0 o 1 items, "Replace" no está disponible
- [ ] Popover se cierra al hacer clic fuera (click outside)
- [ ] Animación CSS básica en apertura/cierre del popover
- [ ] `pnpm typecheck` pasa sin errores

### Story 10 — Quantity Adjustment

- [ ] Input numérico con label "Número de comensales" visible en la página
- [ ] Botón "+" incrementa guest count en 1
- [ ] Botón "−" decrementa guest count (mínimo 1)
- [ ] También se puede tipear directamente en el input
- [ ] Valor mínimo 1, sin máximo
- [ ] Cambio en guest count actualiza el pricing en tiempo real
- [ ] `guestCount` persiste en Zustand
- [ ] `pnpm typecheck` pasa sin errores

### Story 11 — Live Pricing

- [ ] Sección de pricing visible en la página (debajo del plato o en sidebar)
- [ ] Muestra: **Price per plate** (subtotal 1× cada item)
- [ ] Muestra: **Breakdown por categoría** (subtotal por category)
- [ ] Muestra: **Subtotal** (price per plate × guest count)
- [ ] Muestra: **IVA 16%** (half-up rounding)
- [ ] Muestra: **Total** (subtotal + IVA)
- [ ] Todos los valores se actualizan instantáneamente al cambiar selecciones o guest count
- [ ] Estado vacío (sin items) → todos los valores en $0
- [ ] Usa `calculateQuotation()` de `@aromasabor/utils` — no lógica duplicada
- [ ] `pnpm typecheck` y `pnpm build` pasan sin errores

---

## 9. Revisión del Pricing Engine (`packages/utils/src/pricing.ts`)

### ✅ Funcionalidad soportada

| Requisito Story 11 | ¿Soportado? | Nota |
|--------------------|:-----------:|------|
| Calcular subtotal (price × quantity) | ✅ | `items.reduce((acc, item) => acc + item.price * item.quantity, 0)` |
| IVA 16% half-up rounding | ✅ | `roundHalfUp(subtotal * TAX_RATE)` |
| Total (subtotal + IVA) half-up | ✅ | `roundHalfUp(subtotal + tax)` |
| Empty items → todos $0 | ✅ | `if (items.length === 0) return { subtotal: 0, tax: 0, total: 0 }` |
| Validación price ≥ 0 y quantity ≥ 1 | ✅ | Throws Error |
| Zero dependencies, pure function | ✅ | Sin imports externos |

### ❌ Inconsistencias encontradas vs DOMAIN-MODEL.md

| # | Invariante del Domain Model | Código actual | Diferencia |
|---|---------------------------|---------------|------------|
| 1 | `Total = subtotal + tax (exact sum)` (line 254 de DOMAIN-MODEL.md) | `total = roundHalfUp(subtotal + tax)` — vuelve a redondear el resultado de la suma | ❌ **Double rounding.** `total` debería ser `subtotal + tax` (sin `roundHalfUp`). El subtotal ya es exacto, el tax ya fue redondeado. La suma debería ser exacta. En la práctica, la diferencia es ≤ 1 centavo, pero rompe el invariante documentado. |
| 2 | `Line total = unit price × quantity (exact product)` | No se calcula explícitamente — se usa `item.price * item.quantity` directamente en el reduce | ⚠️ **Implícito.** Funciona, pero no hay una variable intermedia `lineTotal`. No es un bug, pero desvía del modelo documentado. |
| 3 | `Subtotal = sum of all line totals (exact sum)` | `items.reduce((acc, item) => acc + item.price * item.quantity, 0)` | ⚠️ **Correcto** pero la suma directa en punto flotante puede acumular errores con muchos items. Para MVP con precios COP (enteros) no hay problema. |

### 🔧 Corrección recomendada

El issue #1 (double rounding) debe corregirse antes de usar en Sprint 3 para evitar discrepanencias de 1 centavo:

**Código actual (line 43):**
```typescript
const total = roundHalfUp(subtotal + tax);
```

**Debe ser:**
```typescript
const total = subtotal + tax;
```

O, alternativamente, alinear con "Total = subtotal + tax (exact sum)" del invariante. Si se quiere un solo punto de redondeo:
```typescript
const total = roundHalfUp(subtotal * (1 + TAX_RATE));
```

Pero el domain model dice "Total = subtotal + tax" (exact sum), así que la corrección correcta es simplemente eliminar el `roundHalfUp` del total.

**Riesgo:** Si `subtotal` tiene ruido de punto flotante (ej: items con precios fraccionarios), `subtotal + tax` podría tener dígitos extra (ej: 116.00000000000001). El `roundHalfUp` actual lo limpia. Pero el invariante dice "exact sum" — la solución correcta es asegurar que `subtotal` sea exacto (redondear a 2 decimales) y entonces `subtotal + tax` será exacto.

**Recomendación final para Sprint 3:**
```typescript
const subtotal = items.reduce((acc, item) => acc + roundHalfUp(item.price * item.quantity), 0);
const tax = roundHalfUp(subtotal * TAX_RATE);
const total = subtotal + tax;
```

Esto asegura:
- Cada line total es half-up rounded a 2 decimales ✅
- Subtotal es suma exacta de line totals ✅
- Tax es half-up rounded ✅
- Total = subtotal + tax (exact sum) ✅

### 📐 Mapeo Story 10/11 → `calculateQuotation`

Para usar la función con guest count global:

```typescript
const quotationItems = selectedItems.map(item => ({
  price: item.price,
  quantity: guestCount,  // mismo valor para todos
}));
const result = calculateQuotation(quotationItems);
```

Donde:
- `result.subtotal` = guestCount × Σ(selected item prices) = **Total antes de IVA**
- `result.tax` = IVA 16%
- `result.total` = **Gran total**
- **Price per plate** = Σ(selected item prices) = `result.subtotal / guestCount`

Para el **breakdown por categoría**, se calcula client-side:

```typescript
const categoryBreakdown = CATEGORIES.map(cat => {
  const catItems = selectedItems.filter(i => i.category === cat.value);
  const subtotal = catItems.reduce((sum, item) => sum + item.price, 0);
  return { label: cat.label, pricePerPlate: subtotal, total: subtotal * guestCount };
}).filter(b => b.pricePerPlate > 0);
```

---

## 10. Plan Día por Día

### Día 1 — Setup y Store

| Tarea | Archivos | Detalle |
|-------|----------|---------|
| Agregar `@aromasabor/utils` a web | `apps/web/package.json` | `pnpm add @aromasabor/utils` |
| Corregir double rounding en pricing engine | `packages/utils/src/pricing.ts` | Cambiar line 43 `roundHalfUp(subtotal + tax)` → `subtotal + tax` (ver sección 9) |
| Extender Zustand store | `apps/web/stores/plate-store.ts` | Agregar `guestCount`, `setGuestCount` |
| Extraer `PlateView` a componente propio | Crear `apps/web/components/PlateView.tsx` | Mover la función `PlateView` de `page.tsx` a componente separado. Re-importar. |
| Verificar `pnpm typecheck` | — | Pase sin errores |

### Día 2 — Story 9: Replace and Remove (popover)

| Tarea | Archivos | Detalle |
|-------|----------|---------|
| Crear `PlateItemPopover` | `apps/web/components/PlateItemPopover.tsx` | Popover contextual al tap en capa del plato. Opciones: Remove, Replace. |
| Integrar popover en `PlateView` | `apps/web/components/PlateView.tsx` | Agregar estado `activeItem` para controlar popover. |
| Crear `ReplaceSelector` | `apps/web/components/ReplaceSelector.tsx` | Mini-lista de items de una categoría (excluyendo el actual). Modal o bottom sheet. |
| Conectar Remove → `deselectItem` | `PlateItemPopover` | Callback al store. |
| Conectar Replace → `deselectItem` + abrir `ReplaceSelector` | `PlateItemPopover` + `ReplaceSelector` | Flujo completo. |
| Casos borde: categoría con 0-1 items | `ReplaceSelector` | Ocultar "Replace" si no hay alternativas. |
| Animación CSS popover | `tailwind.config.js` + componente | fadeIn + scale. |
| Verificar `pnpm typecheck` | — | Pase sin errores. |

### Día 3 — Story 10: Quantity Adjustment

| Tarea | Archivos | Detalle |
|-------|----------|---------|
| Crear `GuestCountInput` | `apps/web/components/GuestCountInput.tsx` | Input numérico + botones +/-. Label "Comensales". Min 1. |
| Conectar a store | `GuestCountInput` | `usePlateStore(s => s.guestCount)` y `setGuestCount`. |
| Diseño UI: ubicación en página | `apps/web/app/(public)/menu/[slug]/page.tsx` | Colocar entre plate view y pricing breakdown. |
| Validación: input directo acepta solo números ≥ 1 | `GuestCountInput` | `onChange` → `parseInt` → `Math.max(1, ...)`. |
| Animación: cambio de valor | `GuestCountInput` | CSS transition en el texto. |
| Verificar `pnpm typecheck` | — | Pase sin errores. |

### Día 4 — Story 11: Live Pricing

| Tarea | Archivos | Detalle |
|-------|----------|---------|
| Crear `PricingBreakdown` | `apps/web/components/PricingBreakdown.tsx` | Panel con todas las secciones de pricing. |
| Price per plate | `PricingBreakdown` | Suma de selected items prices (1× each). |
| Category breakdown | `PricingBreakdown` | Agrupar selected items por categoría, mostrar subtotal por categoría (×1 y ×guestCount). |
| Subtotal, IVA 16%, Total | `PricingBreakdown` | Usar `calculateQuotation()` con items × guestCount. |
| Integrar en página | `apps/web/app/(public)/menu/[slug]/page.tsx` | Colocar `PricingBreakdown` en la cuadrícula. |
| Estado vacío ($0) | `PricingBreakdown` | Mostrar $0 cuando no hay items seleccionados. |
| Formato moneda: locale `es-CO` | `PricingBreakdown` | Usar `es-CO` (corrigiendo deuda de Sprint 2). |
| Verificar `pnpm typecheck` y `pnpm build` | — | Ambos pasan sin errores. |

### Día 5 — Integración, pulido y verificación

| Tarea | Archivos | Detalle |
|-------|----------|---------|
| Flujo completo E2E | Todas | Seleccionar items → ver pricing cambiar → ajustar guest count → ver total cambiar → tap plate → remove → pricing baja → replace → pricing sube. |
| Responsive mobile | `PricingBreakdown`, `GuestCountInput`, `PlateView` | Ver layout en mobile. Ajustar si es necesario. |
| Estados vacío y error | Todas | Sin items, guest count = 0, API falla, etc. |
| Extra: arreglar locale `es-MX` → `es-CO` | `apps/web/app/(admin)/menus/[id]/page.tsx` | Corregir deuda de Sprint 2 (línea 35). |
| `pnpm lint` | — | Sin errores. |
| `pnpm typecheck` | — | Sin errores. |
| `pnpm build` | — | API + Web build exitoso. |

---

## 11. Resumen de Archivos a Modificar/Crear

### Crear (5 archivos)

| Archivo | Líneas estimadas |
|---------|:----------------:|
| `apps/web/components/PlateView.tsx` | ~70 (extraído de page.tsx) |
| `apps/web/components/PlateItemPopover.tsx` | ~60 |
| `apps/web/components/ReplaceSelector.tsx` | ~50 |
| `apps/web/components/GuestCountInput.tsx` | ~40 |
| `apps/web/components/PricingBreakdown.tsx` | ~80 |

### Modificar (4 archivos)

| Archivo | Cambio |
|---------|--------|
| `apps/web/stores/plate-store.ts` | + `guestCount`, `setGuestCount` (~10 líneas) |
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Reemplazar `PlateView` inline por import, agregar `GuestCountInput`, `PricingBreakdown` |
| `apps/web/package.json` | + `@aromasabor/utils` |
| `packages/utils/src/pricing.ts` | Corregir double rounding en `total` (1 línea) |
| `apps/web/app/(admin)/menus/[id]/page.tsx` | `es-MX` → `es-CO` (1 línea, deuda Sprint 2) |

### Sin cambios

| Área | Razón |
|------|-------|
| API (NestJS) | Sin nuevos endpoints |
| Schemas (Mongoose) | Sin cambios en datos |
| Shared Types | Sin nuevos tipos |
| infra (docker, turbo, CI) | Sin cambios |

---

## 12. Criterios de Aceptación por Story

### Story 9
- [ ] Popover aparece al tap en capa del plato
- [ ] Remove deselecciona el item
- [ ] Replace permite elegir otro item de la misma categoría
- [ ] Replace no muestra el item actual como opción
- [ ] Sin items en categoría → solo Remove
- [ ] Popover se cierra al click outside

### Story 10
- [ ] Input guest count visible y funcional
- [ ] +/− botones funcionan
- [ ] Mínimo 1 enforced
- [ ] Pricing se actualiza al cambiar guest count

### Story 11
- [ ] Price per plate visible
- [ ] Breakdown por categoría visible (solo categorías con items)
- [ ] Subtotal, IVA, Total visibles y correctos
- [ ] Actualización en tiempo real
- [ ] Estado vacío → $0
- [ ] Usa `calculateQuotation` de utils package
