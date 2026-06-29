# 🍽️ Menu Digital — Caso de Estudio Técnico v2
**Proyecto:** Plataforma de Cotización de Menús para Eventos  
**Stack:** React Native + Next.js + NestJS + MongoDB  
**Versión:** 2.0 — Incluye edición de plato por cliente, ciclo completo de notificaciones y sistemas de referencia
enlace de ejemplo de menus digital: https://software.hioposcloud.com.co/menu-digital-interactivo

---

> **ESTADO ACTUAL DEL PROYECTO:** Implementado ~60% del v2 spec.
> - ✅ = Completo
> - ⚠️ = Parcial (existe pero simplificado)
> - ❌ = No existe
> - Última actualización: Junio 2026

---

## 1. Descripción del Negocio

Plataforma donde el **Cliente (admin/chef)** publica menús de eventos y el **cliente final** entra por link o QR, arma su plato visualmente por porciones, y recibe cotización automática. **Tanto el cliente como el admin pueden editar el plato en cualquier momento.** Cada vez que alguien edita o confirma, el otro recibe una notificación inmediata.

---

## 2. Actores del Sistema

| Actor | Rol | Dispositivo | Estado |
|-------|-----|-------------|--------|
| Admin (cliente) | Crea menús, ve cotizaciones, edita platos, aprueba/rechaza | Web Next.js (PC/tablet) | ✅ Web admin funcional |
| Cliente | Arma su plato, edita si se equivoca, confirma, recibe aprobación | Mobile App / PWA | ⚠️ Solo web pública (`/menu/[slug]`) — app mobile ❌ |

---

## 3. Flujo General — Ciclo Completo con Edición Bilateral

> **Estado actual:** El flujo llega hasta [4] (admin crea propuesta y la envía al cliente). La edición bilateral y confirmación final no están implementadas.

```
╔══════════════════════════════════════════════════════════════════╗
║                    CICLO DE VIDA DE UN PLATO                    ║
╚══════════════════════════════════════════════════════════════════╝

[1] ADMIN CREA MENÚ ✅
    └─ Define categorías, ítems, nombres exactos, peso por porción, precio
    └─ Publica menú → genera link/QR para compartir

[2] CLIENTE ACCEDE ✅
    └─ Entra por link o QR
    └─ Selecciona categoría por categoría (proteína, carbohidrato, ensalada, salsa, bebida)
    └─ En el centro de la pantalla el plato se va armando visualmente
    └─ Ingresa número de personas
    └─ Sistema calcula precio por plato y total en tiempo real

[3] CLIENTE EDITA SU PLATO (antes de confirmar) ⚠️
    └─ Si se equivocó (ej: puso Chuleta y quería Pechuga)
    └─ Toca el ítem en el plato visual → lo reemplaza ✅
    └─ Cotización se recalcula al instante ✅
    └─ ❌ No hay confirm dialog antes de enviar

[4] CLIENTE CONFIRMA ❌
    └─ Guarda datos: nombre, teléfono, tipo de evento, fecha ❌
    └─ POST /quotations → status: "pending" ❌
    └─ ✉️ NOTIFICACIÓN → Admin ❌
    └─ ✉️ NOTIFICACIÓN → Cliente ❌

[5] ADMIN REVISA LA COTIZACIÓN ❌
    └─ Opción A — Admin APRUEBA sin cambios ❌
    └─ Opción B — Admin EDITA el plato ❌
    └─ Opción C — Admin RECHAZA ❌

[6] CLIENTE EDITA DESPUÉS DE APROBACIÓN ❌

[7] CONFIRMACIÓN FINAL ❌
```

---

## 4. Estados de una Cotización

```
borrador → enviado → modificado_por_cliente → modificado_por_chef → aceptado
                                                            ↘ rechazado
                                                            ↘ expirado
```

> **Nota:** El v2 original usa `pending/edited_by_admin/edited_by_client/approved/confirmed/rejected`.
> El estado `confirmed` (confirmación final) y `approved` (aprobado sin editar) no existen aún.

---

## 5. Lógica de Edición del Plato — Cliente ❌
No implementada en el flujo de propuestas. El plate builder público (`/menu/[slug]`) permite armar un plato pero no enviarlo como cotización.

---

## 6. Arquitectura de Software

### Monorepo con separación de responsabilidades

```
menu-digital/
├── apps/
│   ├── web/                    # Next.js 15 App Router (admin + cliente web)
│   │   ├── app/
│   │   │   ├── (admin)/
│   │   │   │   ├── dashboard/           ✅ Resumen de cotizaciones
│   │   │   │   ├── proposals/           ✅ Lista + detalle + crear
│   │   │   │   ├── menus/               ✅ CRUD de menús
│   │   │   │   └── login/               ✅ Login/Register
│   │   │   ├── (public)/
│   │   │   │   ├── menu/[slug]/         ✅ Plate builder público
│   │   │   │   └── prop/[token]/        ⚠️ Solo lectura (debería permitir editar)
│   │   └── components/
│   │       ├── PlateView/               ✅ Plato visual con capas
│   │       ├── PlateItemPopover/        ✅ Popover editar/remover
│   │       ├── ReplaceSelector/         ✅ Selector de reemplazo
│   │       └── PricingBreakdown/        ✅ Desglose de precios
│   │
│   ├── api/                    # NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/                ✅ Login, register, JWT cookies
│   │   │   │   ├── menus/               ✅ CRUD menús + items
│   │   │   │   ├── proposals/           ⚠️ CRUD básico — sin edición bilateral
│   │   │   │   └── notifications/       ⚠️ Solo DB — sin FCM ni email
│   │   │   └── schemas/
│   │   │       ├── admin.schema.ts      ✅
│   │   │       ├── menu.schema.ts       ⚠️ Flat items vs categories anidadas
│   │   │       ├── proposal.schema.ts   ⚠️ Sin editHistory completo
│   │   │       └── notification.schema.ts ✅
│
├── packages/
│   ├── shared-types/          ⚠️ Tipos definidos pero lógica no implementada
│   └── utils/                 ⚠️ calculateQuotation con IVA, sin breakdown por item
│
└── docker-compose.yml         ⚠️ Solo MongoDB local
```

---

## 7. Stack Tecnológico

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Mobile (cliente) | React Native + Expo | ❌ No iniciado |
| Web admin | Next.js 15 App Router | ✅ |
| Backend API | NestJS (Node.js/TypeScript) | ✅ |
| Base de datos | MongoDB Atlas | ✅ |
| Auth | JWT + cookies httpOnly | ✅ |
| Notificaciones push | Firebase Cloud Messaging | ❌ No iniciado |
| Email fallback | Resend | ❌ No iniciado |
| Imágenes | Cloudinary | ❌ No iniciado |
| Estado global | Zustand | ✅ |
| Fetching/caché | React Query (TanStack) | ✅ |
| Animaciones | CSS transitions (web) | ⚠️ Sin Reanimated |
| Tiempo real | Socket.IO | ❌ No iniciado |

---

## 8. Modelo de Datos — MongoDB

### Colección: `menus`

**Estado actual:** ⚠️ Implementación simplificada
- Items planos con category enum (`entrada`, `plato_fuerte`, `guarnicion`, `postre`)
- Sin `categories[]` anidadas con `maxItems`
- Sin `imageUrl`, `portionGrams`, `unit`, `isAvailable`

**Pendiente v2:** Migrar a estructura anidada con categorías, imágenes, gramaje por porción.

### Colección: `proposals` ( = `quotations` en v2)

**Estado actual:** ⚠️ Implementación parcial
- Sin `clientInfo.phone`, `clientInfo.email`, `clientInfo.eventType`, `clientInfo.fcmToken`
- Sin `pricePerPlate`, `totalPrice` (usa `quotation` calculado)
- `editHistory` sin `previousItems`, `newItems`, `reason`
- Sin estado `confirmed`

---

## 9. API Endpoints (NestJS)

### Auth
```
POST /auth/register              ✅ Registrar admin
POST /auth/login                 ✅ Login admin → JWT cookie
POST /auth/logout                ✅ Logout
GET  /auth/me                    ✅ Perfil actual
POST /auth/client/access         ❌ Token temporal por link de evento
```

### Menús
```
GET    /menus                    ✅ Listar menús
POST   /menus                    ✅ Crear menú
GET    /menus/:id                ✅ Ver menú por ID
GET    /menus/slug/:slug         ✅ Ver menú público por slug
PATCH  /menus/:id                ✅ Editar menú
DELETE /menus/:id                ✅ Eliminar menú
POST   /menus/:id/items          ✅ Agregar ítem
PATCH  /menus/:id/items/:itemId  ✅ Editar ítem
DELETE /menus/:id/items/:itemId  ✅ Eliminar ítem
PATCH  /menus/:id/publish        ✅ Publicar/despublicar
```

### Proposals (= Quotations en v2)
```
POST   /proposals                ✅ Crear propuesta (admin)
GET    /proposals                ✅ Listar todas
GET    /proposals/id/:id         ✅ Detalle por ID (admin)
GET    /proposals/:token         ✅ Ver por token (cliente)
PATCH  /proposals/:id            ⚠️ Update genérico — sin máquina de estados
PATCH  /proposals/:id/send       ✅ Enviar al cliente
DELETE /proposals/:id            ✅ Eliminar
PATCH  /proposals/:id/approve    ❌ Aprobar
PATCH  /proposals/:id/reject     ❌ Rechazar
PATCH  /proposals/:id/status     ❌ Cambio de estado genérico
GET    /proposals/:id/history    ❌ Historial de ediciones
```

### Notificaciones
```
GET  /notifications              ✅ Listar todas
GET  /notifications/:id          ✅ Una notificación
PATCH /notifications/:id/read    ✅ Marcar como leída
POST /notifications/send         ❌ Disparo manual (admin)
GET  /notifications/history      ❌ Historial por cotización
```

---

## 10-17. [Secciones del caso de estudio original sin cambios]

> Nota: El diseño visual (glassmorphism, paleta de colores), sistemas similares (Tripleseat, HoneyBook...), y el plan de negocios se mantienen como referencia para desarrollo futuro.

---

## 🗺️ PLAN DE SPRINTS — Estado Actual del Proyecto

### Proyecto al día de hoy

**✅ Lo que funciona (base sólida):**
- Login/register de admin con JWT + cookies httpOnly
- CRUD completo de menús + items (add/edit/delete/publish)
- Plate builder público: selección por categorías, plato visual con capas, reemplazo de items, pricing en vivo
- Propuestas: crear, enviar por link, ver por token, expiración
- Notificaciones en base de datos
- Dashboard con stats básicos

**⚠️ Lo que existe pero hay que mejorar:**
- Modelo de menú: migrar de items planos a categorías anidadas con maxItems, imágenes, gramaje
- Propuestas: agregar máquina de estados, edición bilateral, approve/reject
- Dashboard: métricas mensuales, filtros

**❌ Lo que no existe:**
- App mobile React Native
- Edición bilateral (cliente edita → notifica admin, admin edita → notifica cliente)
- Notificaciones push FCM + email fallback
- Confirmación final con historial de cambios
- Upload de imágenes a Cloudinary
- Tiempo real con Socket.IO

---

### Sprint 1 — Migración del Modelo de Menú 🎯 (SIGUIENTE)

**Objetivo:** Adaptar el schema de menú a la estructura del v2 (categorías anidadas con maxItems, images, porciones).

**Backend:**
- [ ] Migrar `menu.schema.ts`: de `items[]` plano a `categories[]` con cada categoría conteniendo `items[]`, `maxItems`, `label`, `id`
- [ ] Actualizar `menus.controller.ts` y `menus.service.ts`: endpoints para CRUD de categorías, subir items a categoría específica
- [ ] Agregar campos a item: `imageUrl`, `portionGrams`, `unit`, `isAvailable`
- [ ] Actualizar DTOs

**Frontend Admin:**
- [ ] Rediseñar editor de menú: crear/editar/eliminar categorías, agregar items a categoría específica
- [ ] Mostrar `maxItems` por categoría

**Testing:**
- [ ] Probar CRUD completo de categorías e items desde admin
- [ ] Verificar que el menú público respeta `maxItems`

---

### Sprint 2 — Client Info + Máquina de Estados de Propuesta 🎯

**Objetivo:** Implementar la máquina de estados del v2 y preparar la propuesta para edición bilateral.

**Backend:**
- [ ] Agregar `clientInfo` a `proposal.schema.ts`: phone, email, eventType, fcmToken
- [ ] Agregar `pricePerPlate`, `totalPrice`, `adminNotes`
- [ ] Implementar máquina de estados con transiciones válidas
- [ ] Endpoint `PATCH /proposals/:id/approve`
- [ ] Endpoint `PATCH /proposals/:id/reject`
- [ ] Endpoint `PATCH /proposals/:id/status` (genérico con validación)
- [ ] Endpoint `GET /proposals/:id/history`
- [ ] Log de `editHistory` con `previousItems`, `newItems`, `reason` en cada PATCH

**Frontend Admin:**
- [ ] Botones Aprobar / Rechazar en detalle de propuesta
- [ ] Timeline/historial de cambios
- [ ] Filtro por estado en lista de propuestas
- [ ] Dashboard con valor total del mes

**Testing:**
- [ ] Probar todas las transiciones de estado
- [ ] Verificar notificaciones en DB para cada transición

---

### Sprint 3 — Edición Bilateral del Cliente 🎯

**Objetivo:** El cliente puede editar su plato desde el link público y confirmar la cotización.

**Frontend Público:**
- [ ] Convertir `/prop/[token]` en editor: reutilizar PlateBuilder, cargar selección actual
- [ ] Formulario del cliente: nombre, teléfono, tipo de evento, fecha
- [ ] Botón "Confirmar" → `PATCH /proposals/:id` con status `modificado_por_cliente`
- [ ] Confirm dialog: "¿Seguro quieres cambiar tu selección?" si ya fue enviado
- [ ] Warning: "Al editar, el chef recibirá notificación" si ya fue aprobado
- [ ] Validación: no editar si rechazado
- [ ] Pantalla post-confirmación con badge de estado

**Backend:**
- [ ] Lógica de edición por cliente en `proposals.service.ts`: detectar quién edita, disparar notificación, crear editHistory entry

**Testing:**
- [ ] Flujo completo: cliente recibe link → selecciona → confirma → admin revisa

---

### Sprint 4 — Notificaciones Push + Email 🎯

**Objetivo:** Sistema de notificaciones en tiempo real y email fallback.

**Backend:**
- [ ] Firebase Admin SDK + FCM setup
- [ ] `sendToAdmin()` y `sendToClient()` en notifications service
- [ ] Fallback a Resend email si no hay FCM token
- [ ] Template de mensajes por tipo de notificación
- [ ] `@nestjs/schedule` cron para expirar propuestas vencidas

**Frontend Admin:**
- [ ] Badge de notificaciones no leídas
- [ ] Toast/notification cuando llega una nueva

**Testing:**
- [ ] Probar notificaciones push
- [ ] Probar email fallback
- [ ] Verificar expiración automática

---

### Sprint 5 — Panel de Edición Admin + Comparación 🎯

**Objetivo:** Admin puede editar el plato del cliente y ver cambios antes/después.

**Frontend Admin:**
- [ ] Panel de edición en detalle de propuesta: reemplazar items, ajustar porciones
- [ ] Vista de comparación antes/después cuando el cliente editó
- [ ] Botón "Guardar cambios" → dispara notificación al cliente

**Backend:**
- [ ] Lógica de edición por admin en proposals service
- [ ] Notificación específica "admin_edited"

**Testing:**
- [ ] Ciclo completo: cliente edita → admin ve cambios → admin edita → cliente ve cambios

---

### Sprint 6 — Imágenes + Cloudinary + UI Glassmorphism 🎯

**Objetivo:** Upload de imágenes de platos y refinamiento visual.

**Backend:**
- [ ] Cloudinary integration: upload, delete, get URL
- [ ] Endpoint `POST /menus/:id/items/:itemId/image`
- [ ] Endpoint `DELETE /menus/:id/items/:itemId/image`
- [ ] Actualizar DTOs con imageUrl

**Frontend Admin:**
- [ ] Upload de imagen al crear/editar item
- [ ] Preview de imagen en editor de menú
- [ ] Glassmorphism UI: fondo oscuro, cards con backdrop-filter, dorado/verde/rojo

**Frontend Público:**
- [ ] Imágenes en plate builder
- [ ] Glassmorphism en vista pública

**Testing:**
- [ ] Upload, preview, delete de imágenes

---

### Sprint 7 — App Mobile React Native 🎯

**Objetivo:** App para cliente final en iOS/Android.

**Setup:**
- [ ] Inicializar proyecto Expo en `apps/mobile/`
- [ ] Configurar navegación con React Navigation
- [ ] Zustand store para estado del plato + persistencia
- [ ] React Query para fetching

**Pantallas:**
- [ ] Splash + acceso por link/QR
- [ ] MenúScreen: carrusel de categorías
- [ ] PlateBuilderScreen: armado visual con animación
- [ ] QuotationScreen: cotización + guest count
- [ ] EditPlateScreen: edición de items
- [ ] ConfirmationScreen: post-confirmación

**Notificaciones:**
- [ ] Firebase Cloud Messaging en mobile
- [ ] Hook `useNotification` para recibir push

**Testing:**
- [ ] Build en iOS Simulator y Android Emulator
- [ ] Flujo completo: QR → seleccionar → confirmar → recibir push

---

### Sprint 8+ — Escalabilidad (Futuro)

- [ ] Multi-tenant: múltiples caterers
- [ ] Pasarela de pago Wompi / PayU
- [ ] Analytics: platos más populares
- [ ] PWA como alternativa a app nativa
- [ ] WhatsApp Business API para notificaciones

---

*Documento generado — Menu Digital v2.0*  
*Brikman Paul Morales — JC TECH — Junio 2025 → Junio 2026*
