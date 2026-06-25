# Sprint 2 Audit — Stories 6–8 (Plate Builder pt 1)

> **Date:** 2026-06-25
> **Scope:** View menu · Select items · Visual plate
> **Reference:** MVP-SCOPE-FINAL.md Stories 6, 7, 8

---

## Story 6 — View Menu

> Client opens a public menu URL. They see categories and items with names, weights, and prices.

### ✅ Implementado

| Aspecto | Detalle | Archivo:línea |
|---------|---------|---------------|
| Ruta pública `/menu/[slug]` | Next.js App Router page con `useParams` | `apps/web/app/(public)/menu/[slug]/page.tsx:80` |
| Fetch por slug | `api.get('/menus/slug/' + slug)` — endpoint filtra `isActive: true` | `page.tsx:97` |
| Muestra nombre del menú | `<h1 className="text-4xl font-bold">` | `page.tsx:132` |
| Muestra descripción | Condicional `{menu.description && ...}` | `page.tsx:133` |
| Muestra chef | `menu.createdBy?.name` | `page.tsx:134` |
| Items agrupados por categoría | `CATEGORIES.map()` con `filter` | `page.tsx:120-123` |
| Cada item: nombre | `<p className="text-sm font-medium">` | `page.tsx:199` |
| Cada item: descripción | `<p className="text-xs text-gray-500 truncate">` | `page.tsx:201-202` |
| Cada item: peso (g) | `{item.weight && <span>{item.weight}g</span>}` | `page.tsx:206` |
| Cada item: precio | `formatPrice(item.price)` → `$X,XXX.XX` | `page.tsx:208` |
| Grid responsive | `lg:grid-cols-2` — plate view + selection side by side | `page.tsx:137` |
| Fallback "Menu not found" | Para slugs inválidos o `isActive: false` | `page.tsx:111-117` |
| Loading state | Texto "Loading..." mientras fetch | `page.tsx:103-109` |

### ❌ No implementado / Deuda técnica

| Ausencia | Impacto | Origen |
|----------|---------|--------|
| **Categorías hardcoded** (`entrada`, `plato_fuerte`, `guarnicion`, `postre`) fijas en frontend y backend. MVP pide categorías dinámicas con label y maxItems. | No se pueden crear categorías personalizadas (ej: "Proteína", "Carbohidrato"). | Deuda Story 3 |
| **Sin `imageUrl`** en MenuItem. MVP Story 4 pide "image URL (paste URL, no upload)". | No se muestran imágenes de items en la vista pública. | Deuda Story 4 |
| **No importa shared-types** — `MenuItem` y `Menu` redeclarados localmente en la page. | Si shared-types cambia, hay que actualizar manualmente. Tipado frágil. | Deuda propia |
| **Locale incorrecto** — `formatPrice()` usa `es-MX`. El proyecto es colombiano. | Formato de moneda incorrecto (debe ser `es-CO`). | Deuda propia |
| **Sin `loading.tsx`** — usa inline "Loading..." en vez de un archivo de ruta. | No hay skeleton loader. | Mejora |
| **Sin `error.tsx`** — errores de red capturados inline. | No hay página de error genérica. | Mejora |
| **Sin `not-found.tsx`** — inline "Menu not found". | No hay página 404 genérica. | Mejora |

### Diferencias vs MVP-SCOPE-FINAL.md

| Spec | Realidad | Diferencia |
|------|----------|------------|
| "Categories and items" ✅ | Grupos visuales | OK |
| "With names, weights, and prices" ✅ | Se muestran los 3 campos | OK |
| "Public menu URL" ✅ | `/menu/[slug]` | OK |
| "Categories" (implícitamente dinámicas) | ❌ Hardcoded enum | Deuda Story 3 |

---

## Story 7 — Select Items

> Client taps a category, sees available items, and selects one. Selected item appears in a visual plate area.

### ✅ Implementado

| Aspecto | Detalle | Archivo:línea |
|---------|---------|---------------|
| Acordeón por categoría | Tap category header → expande/colapsa items | `page.tsx:160-217` |
| Lista de items en acordeón | `group.items.map()` | `page.tsx:180-215` |
| Tap item → selecciona | Llama `selectItem(item)` del store | `page.tsx:189` |
| Tap item seleccionado → deselecciona | Llama `deselectItem(item.category)` | `page.tsx:187` |
| Max 1 por categoría | Store: `Record<Category, PlateItem \| null>` | `stores/plate-store.ts:15` |
| Indicador visual selección | `bg-green-500/20 ring-1 ring-green-400/40` | `page.tsx:193-196` |
| Checkmark (✓) en item seleccionado | `{selected ? '✓' : '+'}` | `page.tsx:209` |
| Nombre item seleccionado junto al category label | `{selected && <span>({selected.name})</span>}` | `page.tsx:166-167` |
| Item aparece en plate visual | `PlateView` recibe `selectedItems()` del store | `page.tsx:141` |
| Flecha rotación acordeón | `rotate-180` en expanded | `page.tsx:170` |
| "No items" message | Cuando category no tiene items | `page.tsx:178` |

#### Store (Zustand) — `apps/web/stores/plate-store.ts`

| Método | Comportamiento |
|--------|---------------|
| `selectItem(item)` | Reemplaza selección de la categoría (overwrite) |
| `deselectItem(category)` | Setea la categoría a `null` |
| `clearAll()` | Setea todas las categorías a `null` |
| `selectedItems()` | Retorna array plano de items no-null |
| `isSelected(item)` | Compara `_id` dentro de la categoría |

### ❌ No implementado / Deuda técnica

| Ausencia | Impacto | Sprint |
|----------|---------|--------|
| **Replace directo** — MVP Story 9: "tap item in plate to replace with another from same category". Actualmente hay que deseleccionar y luego seleccionar. | UX no óptima para reemplazo, pero funcionalmente posible. | S3 |
| **Sin animación select/deselect** — Solo hay `fadeIn` en el plate visual. No hay feedback visual al hacer tap. | Feedback pobre al seleccionar. | Mejora |
| **Sin ARIA** — `button` sin `aria-expanded`, `role`, `aria-label`. | Accesibilidad nula. | Mejora |
| **Keyboard navigation** — No hay manejo de teclado (Tab, Enter, Escape). | Solo funciona con mouse/touch. | Mejora |

### Diferencias vs MVP-SCOPE-FINAL.md

| Spec | Realidad | Diferencia |
|------|----------|------------|
| "Taps a category, sees available items" ✅ | Acordeón funcional | OK |
| "Selects one" ✅ | Max 1 por categoría | OK |
| "Selected item appears in visual plate area" ✅ | `PlateView` lo muestra | OK |
| "One per category" (implícito) | ✅ Store fuerza 1 por categoría | OK |
| Category `maxItems` field | ❌ No existe. Pero MVP **cut** "Category validation beyond maxItems" | OK (cut) |

---

## Story 8 — Visual Plate

> As items are selected, they appear stacked in a centered plate view. Each item shows its name and portion weight. Basic CSS fade-in animation.

### ✅ Implementado

| Aspecto | Detalle | Archivo:línea |
|---------|---------|---------------|
| Plato centrado | `mx-auto flex h-72 w-72 items-center justify-center` + `rounded-full` | `page.tsx:54` |
| Capas apiladas (z-index) | Array `layers` con z-index ascendente: entrada(base) → postre(top) | `page.tsx:46-51` |
| Bordes del plato | `border-2 border-white/10 rounded-full` | `page.tsx:55` |
| Capa semitransparente por categoría | `bg-{color}-800/{opacity}` + `backdrop-blur-sm` | `page.tsx:62-63` |
| Nombre del item en cada capa | `<p className="text-sm font-medium text-white drop-shadow-lg">` | `page.tsx:69` |
| Peso (g) en cada capa | `{item.weight && <p>{item.weight}g</p>}` | `page.tsx:70-72` |
| Animación fadeIn | `animate-fadeIn` definida en `tailwind.config.js` con `0.4s ease-out forwards` | `page.tsx:62` |
| Staggered delay | `animationDelay: \`${i * 150}ms\`` | `page.tsx:66` |
| Empty state | "Select items to build your plate" cuando `items.length === 0` | `page.tsx:38-44` |
| Botón "Clear plate" | `clearAll()` del store | `page.tsx:143-147` |

#### Keyframe animation (`apps/web/tailwind.config.js`)

```js
fadeIn: {
  '0%': { opacity: '0', transform: 'scale(0.9)' },
  '100%': { opacity: '1', transform: 'scale(1)' },
}
```

### ❌ No implementado / Deuda técnica

| Ausencia | Impacto | Sprint |
|----------|---------|--------|
| **Sin imágenes en el plato** — Solo texto. Sin `imageUrl` no se puede mostrar representación visual de la comida. | Plate visual es textual, no visual. | Deuda Story 4 |
| **Colores hardcoded por categoría** — `bg-amber-800/60`, `bg-yellow-700/50`, etc. No son configurables. | Si se agregan categorías dinámicas, no hay color asignado. | Deuda Story 3 |
| **Sin precio en el plato** — El plate view muestra solo nombre + peso. No hay precio por capa ni total. | No se ve el costo mientras se construye el plato. | S3 (Story 11) |
| **Sin animación al deseleccionar** — `fadeIn` solo en montaje. Si se quita un item, desaparece instantáneamente. | Transición brusca al remover. | Mejora |
| **Plate dimensions fijas** — `h-72 w-72` (288px). No responsive en mobile. | En pantallas chicas el plato puede ser muy grande o pequeño. | Mejora |
| **`PlateView` inline** — Definido dentro del mismo archivo page.tsx, no en `components/`. | No reutilizable para la página de proposal (`/prop/[token]`). | Refactor |

### Diferencias vs MVP-SCOPE-FINAL.md

| Spec | Realidad | Diferencia |
|------|----------|------------|
| "Stacked in a centered plate view" ✅ | Capas con z-index, centrado, border-radius | OK |
| "Each item shows name and portion weight" ✅ | Nombre + peso(g) en cada capa | OK |
| "Basic CSS fade-in animation" ✅ | `fadeIn` keyframe + staggered delay | OK |
| "As items are selected" (plural) ✅ | Múltiples items = múltiples capas | OK |
| "Reanimated 3 animations" | ❌ No usado. **MVP cut:** CSS transitions instead | OK (cut) |

---

## Archivos que participan en Sprint 2

### Creados

| Archivo | Rol | Líneas |
|---------|-----|--------|
| `apps/web/stores/plate-store.ts` | Zustand store: selecciones por categoría, select/deselect/clear/isSelected | 60 |

### Modificados

| Archivo | Cambio | Líneas relevantes |
|---------|--------|-------------------|
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Reconstruido: Plate Builder completo (PlateView, acordeón, selección, clear) | 1-226 |
| `apps/web/tailwind.config.js` | Añadido keyframe `fadeIn` + animation `fadeIn` | 12-18 |
| `apps/web/app/(admin)/menus/[id]/page.tsx` | Añadido campo `weight` al form de item (add/edit), mostrado en lista | 51, 82-83, 112, 125, 243-251, 291 |
| `apps/api/src/schemas/menu.schema.ts` | Añadido `weight?: number` (min 0) a MenuItem | 20-21 |
| `apps/api/src/modules/menus/menus.service.ts` | Añadido `weight` a signature de `updateItem()` | 55, 70 |
| `packages/shared-types/src/index.ts` | Añadido `weight?: number` a interface MenuItem | 27 |

### Creados (vacíos — preparados para Sprint 3)

| Archivo | Propósito |
|---------|-----------|
| `apps/web/hooks/` | Directorio listo para custom hooks |
| `apps/web/components/` | Directorio listo para componentes reutilizables |

---

## Deuda técnica de Sprint 2

### Scope drift

| Ítem | Detalle | Gravedad |
|------|---------|----------|
| `weight` agregado en Sprint 2 | MVP Story 4 (Sprint 1) pide "portion grams". Debió agregarse en Sprint 1. | Baja — ya existe, solo es inconsistencia de trazabilidad |
| `PlateView` inline vs component | Debería estar en `components/PlateView.tsx` para reuso en `/prop/[token]` | Media — toca refactorear antes o durante Sprint 5 |

### Problemas de calidad

| Ítem | Archivo | Impacto |
|------|---------|---------|
| Locale `es-MX` debe ser `es-CO` | `[slug]/page.tsx:34`, `[id]/page.tsx:35` | Formato de moneda incorrecto |
| Local `MenuItem` y `Menu` types no importados de shared-types | `[slug]/page.tsx:10-24` | Duplicación, fragilidad |
| Sin manejo de error de red en fallback | `[slug]/page.tsx:97-101` | Si el API falla por CORS/network, se muestra "Menu not found" aunque el menú sí exista |
| Sin `public/favicon.ico` | — | Favicon por defecto de Next.js |

---

## ¿Qué bloquea Sprint 3?

**Nada bloqueante.** Stories 9–11 (Replace/Remove, Quantity, Live Pricing) pueden comenzar sin cambios en Sprint 2.

Sin embargo, existe **deuda upstream que degradará la calidad de Sprint 3** si no se corrige antes:

| Deuda | Afecta Story | Por qué |
|-------|-------------|---------|
| **Sin `imageUrl`** (Story 4) | S3 (9, 10, 11) | Replace/remove sin imágenes = UX pobre |
| **Categorías hardcoded** (Story 3) | S3 (11) | Pricing breakdown atado a categorías fijas |
| **Sin validación publish** (Story 5) | S3 (6, 7, 8) | Menús vacíos publicados = Plate Builder sin items |
| **`PlateView` inline** | S5 (14) | Habrá que extraerlo para reusar en `/prop/[token]` |

### Lo que Sprint 3 necesita de Sprint 2 (y está OK)

| Necesidad | Estado |
|-----------|--------|
| Store Zustand con selecciones por categoría | ✅ Listo, ampliable |
| Ruta `/menu/[slug]` funcionando | ✅ Listo |
| categorías `entrada/plato_fuerte/guarnicion/postre` | ✅ Existen (aunque hardcoded) |
| Pricing engine en `@aromasabor/utils` | ✅ Listo desde Sprint 0 |
| API `GET /menus/slug/:slug` | ✅ Listo |

---

## Resumen

| Story | Estado | Implementado | Deuda | Bloquea S3 |
|-------|--------|-------------|-------|------------|
| 6 — View Menu | ✅ | Core functional | Categorías fijas, sin imageUrl, locale MX | No |
| 7 — Select Items | ✅ | Core functional | Sin animación select, sin ARIA | No |
| 8 — Visual Plate | ✅ | Core functional | Sin imágenes, colores hardcoded, PlateView inline | No |

**Conclusión:** Stories 6–8 están implementadas en funcionalidad core. La deuda principal no es de Sprint 2 sino arrastrada de Stories 3–4 (categorías fijas, falta imageUrl). Sprint 3 puede comenzar sin blockers, pero la calidad del Plate Builder se beneficiaría de resolver la deuda de Stories 3–5 primero.
