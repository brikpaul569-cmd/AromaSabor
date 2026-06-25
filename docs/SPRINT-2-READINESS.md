# Sprint 2 Readiness — Technical Audit

> **Date:** 2026-06-25
> **Auditor:** opencode
> **Scope:** Stories 1–8 vs MVP-SCOPE-FINAL.md

---

## 1. Sprint State (⚠️ Contradiction)

| Evidence | Value |
|----------|-------|
| `git log` HEAD | `5791695 feat: Sprint 2 complete — Plate Builder (Stories 6-8)` |
| `git status` | Clean working tree, ahead of `origin/develop` by 1 commit |
| **Conclusion** | Sprint 2 (Stories 6–8) ya está **commiteado** en el branch `develop` local. Si tu intención es comenzar *Sprint 3* (Stories 9–11: Replace/Qty/Pricing), el reporte igual aplica. |

---

## 2. Stories 1–5: Estado real vs MVP-SCOPE-FINAL

### Story 1 — Admin Login ✅ (COMPLETA)

| Requisito | Estado |
|-----------|--------|
| Register con email + password | ✅ `POST /api/auth/register` |
| Login valida credenciales | ✅ bcrypt, JWT en httpOnly cookie |
| Protected admin layout | ✅ `(admin)/layout.tsx` con check a `/auth/me` |
| Logout | ✅ `POST /api/auth/logout` |

### Story 2 — Create Menu ✅ (COMPLETA, con deuda menor)

| Requisito | Estado |
|-----------|--------|
| Crear menú con nombre | ✅ `POST /api/menus` |
| Auto-genera slug único | ✅ con `-{timestamp}` suffix en colisión |
| Listar menús | ✅ `GET /api/menus` |
| UI create form | ✅ `apps/web/app/(admin)/menus/new/page.tsx` |
| UI list view | ✅ `apps/web/app/(admin)/menus/page.tsx` |

### Story 3 — Manage Categories ⚠️ (INCOMPLETA — DEUDA TÉCNICA)

| Requisito | Estado |
|-----------|--------|
| Admin crea categorías dinámicamente | ❌ **Hardcoded** `enum: ['entrada','plato_fuerte','guarnicion','postre']` |
| Cada categoría tiene label | ❌ Solo existe como enum value, sin campo `label` persistido |
| Cada categoría tiene `maxItems` | ❌ No existe el campo |
| UI para agregar categorías | ❌ No existe |

**Impacto:** Para implementar categorías dinámicas se requiere:
- Cambiar schema: eliminar `enum` estático, agregar campo `categories: [{ label: string, maxItems?: number }]`
- Cambiar MenuItem.category de `string enum` a `string` libre (referencia a category.label)
- Migrar datos existentes
- Agregar endpoints CRUD de categorías
- Agregar UI correspondiente

**Decisión requerida:** ¿Aceptar el enum fijo como simplificación para MVP o refactorizar antes de Sprint 3?

### Story 4 — Manage Items ⚠️ (INCOMPLETA — DEUDA TÉCNICA)

| Requisito | Estado |
|-----------|--------|
| Name | ✅ |
| Image URL (paste URL, no upload) | ❌ **Campo `imageUrl` no existe** en MenuItem |
| Portion grams (weight) | ✅ Añadido (aunque en Sprint 2, no en Sprint 1) |
| Price per portion | ✅ |
| Remove (hide, not delete) | ❌ **Hard-delete** con `$pull` del array. No hay flag `isHidden` ni `isActive` por item. |

**Impacto:**
- Sin `imageUrl`, la UI de categorías e items nunca podrá mostrar imágenes (Story 6+ requiere esto)
- Hard-delete significa que al des-publicar un item se pierde el dato permanentemente. El MVP pide ocultar.

### Story 5 — Publish Menu ⚠️ (INCOMPLETA — DEUDA TÉCNICA)

| Requisito | Estado |
|-----------|--------|
| Toggle isActive | ✅ `PATCH /api/menus/:id/publish` |
| Público vía slug | ✅ `GET /api/menus/slug/:slug` (filtra `isActive: true`) |
| **Validación: mínimo 1 categoría con 1 item** | ❌ **No existe**. `publish()` acepta cualquier menú vacío. |

**Impacto:** Se puede publicar un menú sin items, generando una URL pública vacía. UX pobre.

---

## 3. Stories 6–8 (Sprint 2): Estado real

Según `git log HEAD` y `PROJECT-STATUS.md`, Sprint 2 está completo.

### Story 6 — View Menu ✅

| Requisito | Estado |
|-----------|--------|
| Client opens `/menu/:slug` | ✅ |
| See categories with items | ✅ |
| See names, weights, prices | ✅ |

### Story 7 — Select Items ✅

| Requisito | Estado |
|-----------|--------|
| Tap category → see items | ✅ Accordion |
| Select one per category | ✅ Zustand store |
| Selected item appears in plate | ✅ |

### Story 8 — Visual Plate ✅

| Requisito | Estado |
|-----------|--------|
| Stacked centered plate view | ✅ |
| Name + portion weight per layer | ✅ |
| CSS fade-in animation | ✅ |

### Observaciones sobre Sprint 2:
- El campo `weight` se agregó en este sprint, pero pertenece conceptualmente a Story 4 (Sprint 1)
- No hay `imageUrl` — las imágenes no se muestran en ningún lado (ni en admin, ni en público)
- No hay reemplazar/quitar items (Story 9 — Sprint 3)
- No hay ajuste de cantidad (Story 10 — Sprint 3)
- No hay pricing en vivo (Story 11 — Sprint 3)
- El `plate-store.ts` limita a 1 item por categoría, correcto para Stories 6–8

---

## 4. Endpoints Existentes (21 total)

### Públicos (7) — Sin autenticación
| Método | Ruta | Archivo | Línea |
|--------|------|---------|-------|
| POST | `/api/auth/register` | auth.controller.ts | 19 |
| POST | `/api/auth/login` | auth.controller.ts | 29 |
| POST | `/api/auth/logout` | auth.controller.ts | 39 |
| GET | `/api/menus` | menus.controller.ts | 22 |
| GET | `/api/menus/slug/:slug` | menus.controller.ts | 27 |
| GET | `/api/menus/:id` | menus.controller.ts | 32 |
| GET | `/api/proposals/:token` | proposals.controller.ts | 15 |

### Protegidos (14) — JWT requerido
| Método | Ruta | Archivo | Línea |
|--------|------|---------|-------|
| GET | `/api/auth/me` | auth.controller.ts | 46 |
| POST | `/api/menus` | menus.controller.ts | 13 |
| PATCH | `/api/menus/:id` | menus.controller.ts | 66 |
| DELETE | `/api/menus/:id` | menus.controller.ts | 71 |
| PATCH | `/api/menus/:id/publish` | menus.controller.ts | 38 |
| POST | `/api/menus/:id/items` | menus.controller.ts | 44 |
| PATCH | `/api/menus/:id/items/:itemId` | menus.controller.ts | 50 |
| DELETE | `/api/menus/:id/items/:itemId` | menus.controller.ts | 60 |
| POST | `/api/proposals` | proposals.controller.ts | 10 |
| GET | `/api/proposals` | proposals.controller.ts | 21 |
| PATCH | `/api/proposals/:id` | proposals.controller.ts | 27 |
| DELETE | `/api/proposals/:id` | proposals.controller.ts | 33 |
| GET | `/api/notifications` | notifications.controller.ts | 10 |
| PATCH | `/api/notifications/:id/read` | notifications.controller.ts | 16 |

---

## 5. Páginas Web Existentes (9 total)

| Ruta | Tipo | Archivo | Estado |
|------|------|---------|--------|
| `/` | Public | `app/page.tsx` | ✅ Landing |
| `/login` | Admin | `app/(admin)/login/page.tsx` | ✅ Login + Register |
| `/dashboard` | Admin | `app/(admin)/dashboard/page.tsx` | ✅ Dashboard |
| `/menus` | Admin | `app/(admin)/menus/page.tsx` | ✅ Lista menús |
| `/menus/new` | Admin | `app/(admin)/menus/new/page.tsx` | ✅ Crear menú |
| `/menus/[id]` | Admin | `app/(admin)/menus/[id]/page.tsx` | ✅ Editor items |
| `/proposals` | Admin | `app/(admin)/proposals/page.tsx` | ⚠️ **Stub** — solo texto |
| `/menu/[slug]` | Public | `app/(public)/menu/[slug]/page.tsx` | ✅ Plate Builder |
| `/prop/[token]` | Public | `app/(public)/prop/[token]/page.tsx` | ⚠️ **Stub** — solo texto |

**Problemas de Frontend:**
- No existen `loading.tsx`, `error.tsx`, `not-found.tsx`
- No existe `middleware.ts` (protección auth es 100% client-side)
- `components/` y `hooks/` están vacíos
- `public/` está vacío (sin favicon)
- `formatPrice()` usa locale `es-MX` en un proyecto colombiano (debería ser `es-CO`)

---

## 6. Schemas Implementados (4 Mongoose + Shared Types)

### Admin
| Campo | Tipo | Constraints |
|-------|------|-------------|
| email | string | required, unique, lowercase |
| name | string | required |
| passwordHash | string | required |
| role | string | default: 'admin' |

### Menu → MenuItem (embedded)
| Menu | MenuItem |
|------|----------|
| name: string | name: string |
| slug: string (unique) | description: string |
| description?: string | category: **enum fijo** (entrada/plato_fuerte/guarnicion/postre) |
| items: MenuItem[] | price: number (min 0) |
| isActive: boolean | weight?: number |
| createdBy: ObjectId (ref Admin) | ❌ **Sin imageUrl** |

### Proposal → ProposalItem, EditHistoryEntry (embedded)
| Proposal | ProposalItem | EditHistoryEntry |
|----------|-------------|------------------|
| menuId: ObjectId | name: string | modifiedBy: enum |
| token: string (unique) | description: string | modifiedAt: Date |
| clientName: string | category: enum | note?: string |
| eventDate: string | price: number | |
| guestCount: number | quantity: number | |
| items: ProposalItem[] | ❌ **Sin weight** (a diferencia de MenuItem) | |
| notes: string | | |
| status: enum (7 estados) | | |
| quotation: number | | |
| createdBy: ObjectId | | |
| expiresAt: Date | | |
| lastModifiedBy?: enum | | |
| lastModifiedAt?: Date | | |
| editHistory?: EditHistoryEntry[] | | |

### Notification
| Campo | Tipo | Constraints |
|-------|------|-------------|
| proposalId | ObjectId | ref Proposal |
| type | enum | 5 tipos |
| message | string | required |
| read | boolean | default: false |

### Shared Types (`packages/shared-types/src/index.ts`)
- Interfaces: Admin, Menu, MenuItem, Proposal, ProposalItem, EditHistoryEntry, Notification
- Auth: LoginRequest, LoginResponse
- API: ApiError, PaginatedResponse\<T\>
- Enums: CategoryType, ProposalStatus, EditorRole, NotificationType

---

## 7. Diferencias Código Actual vs MVP-SCOPE-FINAL.md

### 🔴 Bloqueantes (deben corregirse)

| # | Diferencia | Archivos afectados | Prioridad |
|---|-----------|-------------------|-----------|
| 1 | **Categorías hardcoded** — MVP pide categorías dinámicas con label y maxItems. Actualmente son enum fijo. | `menu.schema.ts:14`, `menus.service.ts:46`, `[id]/page.tsx:27-32`, `[slug]/page.tsx:26-31` | **Alta** |
| 2 | **Falta `imageUrl` en MenuItem** — MVP Story 4 lo requiere explícitamente. | `menu.schema.ts`, `shared-types/index.ts`, `menus.service.ts`, admin y public pages | **Alta** |
| 3 | **Hard-delete de items** — MVP dice "hide, not delete". Actualmente `$pull` elimina permanentemente. | `menus.service.ts:79-90` | **Media** |
| 4 | **Sin validación al publicar** — MVP exige mínimo 1 categoría con 1 item. `publish()` no valida nada. | `menus.service.ts:92-97` | **Media** |

### 🟡 No bloqueantes pero relevantes

| # | Diferencia | Archivos | Nota |
|---|-----------|----------|------|
| 5 | `weight` agregado en Sprint 2, no en Sprint 1 (Story 4). Ya existe, es un problema de trazabilidad. | — | Bajo impacto |
| 6 | `ProposalItem` schema **no incluye `weight`** pero `ProposalItem` interface en shared-types extiende `MenuItem` (que sí tiene weight). Type mismatch potencial. | `proposal.schema.ts`, `shared-types/index.ts` | Inconsistencia |
| 7 | No hay `@nestjs/schedule` cron para expiration de proposals. El schema pide `expiresAt` pero no hay job. | — | Sprint 5 |
| 8 | Las rutas `/proposals` y `/prop/[token]` son stubs. Los endpoints existen pero no hay UI. | `proposals/page.tsx`, `prop/[token]/page.tsx` | Sprint 4-5 |
| 9 | `formatPrice()` usa locale `es-MX` en vez de `es-CO`. | `[id]/page.tsx:35`, `[slug]/page.tsx:35` | Cosmético |
| 10 | No hay `middleware.ts` — la protección del admin layout es 100% client-side. | — | Seguridad |
| 11 | `components/`, `hooks/`, `public/` están vacíos. No hay loading/error/not-found pages. | — | Mejora continua |

### 🔵 No issues — funciona según spec
- Stories 1 (login), 2 (create menu), 6 (view menu), 7 (select items), 8 (visual plate)
- JWT auth flow con httpOnly cookie
- Pricing engine (`packages/utils/src/pricing.ts`)
- Plate Builder Zustand store
- Module structure (auth, menus, proposals, notifications)

---

## 8. Resumen de Deuda Técnica

| Categoría | Items | Prioridad |
|-----------|-------|-----------|
| **Funcionalidad faltante** | Categorías dinámicas, imageUrl, validación publish | Alta |
| **Desviación de spec** | Hard-delete vs hide, weight en sprint incorrecto | Media |
| **Seguridad** | Sin middleware.ts, sin rate limiting | Media |
| **UX** | Stubs, sin loading/error states, sin favicon | Baja |
| **Consistencia** | Locale MX vs CO, weight faltante en ProposalItem, NotificationType mismatch | Baja |

---

## 9. Recomendación

1. **Si vas a comenzar Sprint 2 (Stories 6–8):** Ya está hecho. El commit `5791695` los implementa. No hay nada que hacer.
2. **Si vas a comenzar Sprint 3 (Stories 9–11):** Corrige primero los items **🔴 bloqueantes #1–4**:
   - Decide si mantienes categorías fijas o implementas dinámicas (es un refactor de mediana escala)
   - Agrega `imageUrl` a MenuItem (Story 4 nunca se terminó)
   - Cambia hard-delete a soft-delete (agrega `isActive` flag en MenuItem)
   - Agrega validación en `publish()`
3. **Luego** procede con Stories 9–11 (Replace/Qty/Pricing).
