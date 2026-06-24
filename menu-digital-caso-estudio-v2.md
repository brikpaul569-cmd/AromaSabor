# 🍽️ Menu Digital — Caso de Estudio Técnico v2
**Proyecto:** Plataforma de Cotización de Menús para Eventos  
**Stack:** React Native + Next.js + NestJS + MongoDB  
**Versión:** 2.0 — Incluye edición de plato por cliente, ciclo completo de notificaciones y sistemas de referencia
enlace de ejemplo de menus digital: https://software.hioposcloud.com.co/menu-digital-interactivo
---

## 1. Descripción del Negocio

Plataforma donde el **Cliente (admin/chef)** publica menús de eventos y el **cliente final** entra por link o QR, arma su plato visualmente por porciones, y recibe cotización automática. **Tanto el cliente como el admin pueden editar el plato en cualquier momento.** Cada vez que alguien edita o confirma, el otro recibe una notificación inmediata.

---

## 2. Actores del Sistema

| Actor | Rol | Dispositivo |
|-------|-----|-------------|
| Admin (cliente) | Crea menús, ve cotizaciones, edita platos, aprueba/rechaza | Web Next.js (PC/tablet) |
| Cliente | Arma su plato, edita si se equivoca, confirma, recibe aprobación | Mobile App / PWA |

---

## 3. Flujo General — Ciclo Completo con Edición Bilateral

```
╔══════════════════════════════════════════════════════════════════╗
║                    CICLO DE VIDA DE UN PLATO                    ║
╚══════════════════════════════════════════════════════════════════╝

[1] ADMIN CREA MENÚ
    └─ Define categorías, ítems, nombres exactos, peso por porción, precio
    └─ Publica menú → genera link/QR para compartir

[2] CLIENTE ACCEDE
    └─ Entra por link o QR
    └─ Selecciona categoría por categoría (proteína, carbohidrato, ensalada, salsa, bebida)
    └─ En el centro de la pantalla el plato se va armando visualmente
    └─ Ingresa número de personas
    └─ Sistema calcula precio por plato y total en tiempo real

[3] CLIENTE EDITA SU PLATO (antes de confirmar)
    └─ Si se equivocó (ej: puso Chuleta y quería Pechuga)
    └─ Toca el ítem en el plato visual → lo reemplaza
    └─ Cotización se recalcula al instante

[4] CLIENTE CONFIRMA
    └─ Guarda datos: nombre, teléfono, tipo de evento, fecha
    └─ POST /quotations → status: "pending"
    └─ ✉️ NOTIFICACIÓN → Admin: "Nueva cotización de [Cliente] para [N] personas - $[Total]"
    └─ ✉️ NOTIFICACIÓN → Cliente: "Tu cotización fue enviada, espera confirmación"

[5] ADMIN REVISA LA COTIZACIÓN
    Opción A — Admin APRUEBA sin cambios:
        └─ PATCH /quotations/:id → status: "approved"
        └─ ✉️ NOTIFICACIÓN → Cliente: "¡Tu plato fue aprobado! Nos vemos en la [fecha]"

    Opción B — Admin EDITA el plato:
        └─ Cambia ítems, porciones, o número de personas
        └─ Guarda cambios → status: "edited_by_admin"
        └─ ✉️ NOTIFICACIÓN → Cliente: "El chef ajustó tu plato, por favor revísalo y confírmalo"
        └─ Cliente ve los cambios resaltados en su app

    Opción C — Admin RECHAZA:
        └─ status: "rejected" + nota de motivo
        └─ ✉️ NOTIFICACIÓN → Cliente: "El chef no puede preparar esta selección, contáctanos"

[6] CLIENTE EDITA DESPUÉS DE APROBACIÓN (si aplica)
    └─ Cliente cambia algo en su plato ya enviado
    └─ PATCH /quotations/:id → status: "edited_by_client"
    └─ ✉️ NOTIFICACIÓN → Admin: "[Cliente] modificó su plato. Revisa los cambios."
    └─ Admin vuelve al paso [5]

[7] CONFIRMACIÓN FINAL
    └─ Admin aprueba versión final → status: "confirmed"
    └─ ✉️ NOTIFICACIÓN → Cliente: "¡Perfecto! Tu menú queda confirmado para el evento"
    └─ Ambas interfaces muestran el plato en estado bloqueado / solo lectura
```

---

## 4. Estados de una Cotización

```
pending → edited_by_admin → edited_by_client → confirmed
                          ↘ approved
                          ↘ rejected
```

| Estado | Quién lo activa | Qué significa |
|--------|----------------|--------------|
| `pending` | Cliente al confirmar | Esperando revisión del admin |
| `edited_by_admin` | Admin modifica algo | Cliente debe revisar los cambios |
| `edited_by_client` | Cliente modifica después de enviar | Admin debe revisar de nuevo |
| `approved` | Admin aprueba sin editar | Listo, sin necesidad de nueva confirmación |
| `confirmed` | Admin aprueba versión editada | Confirmación final bidireccional |
| `rejected` | Admin rechaza | No se puede preparar |

---

## 5. Lógica de Edición del Plato — Cliente

### ¿Cuándo puede editar el cliente?

| Momento | ¿Puede editar? | Comportamiento |
|---------|---------------|----------------|
| Antes de confirmar | ✅ Sí, libremente | Recalcula precio en tiempo real |
| Después de confirmar (status: pending) | ✅ Sí, con advertencia | "¿Seguro que quieres cambiar tu selección?" |
| Después de aprobación admin (status: approved/confirmed) | ⚠️ Solo con aviso | "Al editar, el chef recibirá notificación para revisar de nuevo" |
| Cotización rechazada | ❌ No editable | Debe crear nueva cotización |

### Flujo técnico de edición por el cliente

```typescript
// React Native — pantalla de plato activo
// El cliente toca un ítem en el plato visual

onPressItem(item) {
  if (quotation.status === 'rejected') {
    showToast('Esta cotización fue rechazada. Crea una nueva.');
    return;
  }
  if (['approved', 'confirmed'].includes(quotation.status)) {
    showConfirmDialog(
      '¿Editar plato aprobado?',
      'El chef recibirá notificación para revisar nuevamente.',
      () => openItemSelector(item.categoryId)
    );
  } else {
    openItemSelector(item.categoryId);
  }
}

// Al guardar la edición
async saveEdit(updatedItems) {
  await api.patch(`/quotations/${id}`, {
    selectedItems: updatedItems,
    status: 'edited_by_client',
    editedBy: 'client',
    editedAt: new Date()
  });
  // Esto dispara la notificación push al admin automáticamente desde el backend
}
```

---

## 6. Arquitectura de Software

### Monorepo con separación de responsabilidades

```
menu-digital/
├── apps/
│   ├── mobile/               # React Native + Expo (cliente final)
│   │   ├── screens/
│   │   │   ├── MenuScreen.tsx        # Selección de categorías
│   │   │   ├── PlateBuilderScreen.tsx # Armado visual del plato
│   │   │   ├── QuotationScreen.tsx   # Cotización y número de personas
│   │   │   ├── EditPlateScreen.tsx   # Edición de ítems del plato ← NUEVO
│   │   │   └── ConfirmationScreen.tsx
│   │   ├── components/
│   │   │   ├── PlateVisual/          # Animación del plato componiéndose
│   │   │   ├── ItemSelector/         # Carrusel de ítems por categoría
│   │   │   ├── EditItemModal/        # Modal para reemplazar un ítem ← NUEVO
│   │   │   └── StatusBadge/          # Badge de estado de la cotización
│   │   └── hooks/
│   │       ├── useQuotation.ts
│   │       ├── usePlateEditor.ts    ← NUEVO
│   │       └── useNotification.ts
│   │
│   ├── web-admin/            # Next.js 14 App Router (admin)
│   │   ├── app/
│   │   │   ├── dashboard/           # Resumen de cotizaciones
│   │   │   ├── quotations/[id]/     # Detalle + edición del plato
│   │   │   │   ├── page.tsx
│   │   │   │   └── EditPlatePanel.tsx  ← NUEVO
│   │   │   └── menus/               # CRUD de menús
│   │   └── components/
│   │       ├── QuotationTimeline/   # Historial de cambios ← NUEVO
│   │       └── PlateComparison/     # Ver qué cambió vs versión anterior ← NUEVO
│   │
│   └── api/                  # NestJS
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── menus/
│       │   │   ├── quotations/      # Incluye lógica de edición bilateral
│       │   │   └── notifications/   # FCM + historial de notificaciones
│       │   └── common/
│       │       ├── guards/
│       │       ├── interceptors/
│       │       └── pipes/
│
├── packages/
│   ├── shared-types/          # Interfaces TypeScript compartidas
│   ├── utils/                 # calculateQuotation, formatCurrency
│   └── notification-templates/ # Templates de mensajes push/email ← NUEVO
│
└── docker-compose.yml
```

---

## 7. Stack Tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Mobile (cliente) | React Native + Expo | iOS y Android con un solo código |
| Web admin | Next.js 14 App Router | SSR, deploy fácil Vercel, excelente DX |
| Backend API | NestJS (Node.js/TypeScript) | Modular, escalable, mismo lenguaje |
| Base de datos | MongoDB Atlas | Documentos flexibles, free tier, ideal para menús que evolucionan |
| Auth | NextAuth.js (admin) + JWT (cliente) | Admin con session, cliente con token temporal |
| Notificaciones push | Firebase Cloud Messaging | Gratis, funciona iOS y Android |
| Email fallback | Resend (resend.com) | Si el cliente no tiene la app aún, recibe email |
| Imágenes | Cloudinary | Upload desde mobile, thumbnails automáticos |
| Estado global | Zustand | Ligero, sin boilerplate |
| Fetching/caché | React Query (TanStack) | Caché inteligente, revalidación automática |
| Animaciones mobile | Reanimated 3 | Animación del plato componiéndose, 60fps |
| Tiempo real | Socket.IO en NestJS | Admin ve en vivo cuando el cliente está editando |
| Deploy API | Railway o Render | NestJS + MongoDB, tier gratuito para MVP |
| Deploy web | Vercel | Next.js nativo |
| Monorepo | Turborepo | Builds incrementales, tipos compartidos |

---

## 8. Modelo de Datos — MongoDB

### Colección: `menus`

```json
{
  "_id": "ObjectId",
  "name": "Menú Ejecutivo Bodas",
  "slug": "menu-ejecutivo-bodas",
  "isActive": true,
  "categories": [
    {
      "id": "proteinas",
      "label": "Proteína",
      "maxItems": 1,
      "items": [
        {
          "id": "pechuga-plancha",
          "name": "Pechuga a la Plancha",
          "imageUrl": "https://cloudinary.../pechuga.jpg",
          "portionGrams": 200,
          "pricePerPortion": 4500,
          "unit": "gr",
          "isAvailable": true
        },
        {
          "id": "chuleta-cerdo",
          "name": "Chuleta de Cerdo",
          "imageUrl": "https://cloudinary.../chuleta.jpg",
          "portionGrams": 220,
          "pricePerPortion": 5000,
          "unit": "gr",
          "isAvailable": true
        },
        {
          "id": "lomo-res",
          "name": "Lomo de Res al Jugo",
          "imageUrl": "https://cloudinary.../lomo.jpg",
          "portionGrams": 180,
          "pricePerPortion": 6500,
          "unit": "gr",
          "isAvailable": true
        }
      ]
    },
    {
      "id": "carbohidratos",
      "label": "Carbohidrato",
      "maxItems": 2,
      "items": [
        { "id": "arroz-blanco", "name": "Arroz Blanco", "portionGrams": 150, "pricePerPortion": 1200 },
        { "id": "papa-criolla", "name": "Papa Criolla Salada", "portionGrams": 120, "pricePerPortion": 1000 },
        { "id": "yuca-frita", "name": "Yuca Frita", "portionGrams": 130, "pricePerPortion": 1100 }
      ]
    },
    {
      "id": "ensaladas",
      "label": "Ensalada",
      "maxItems": 1,
      "items": [
        { "id": "ensalada-mixta", "name": "Ensalada Mixta", "portionGrams": 100, "pricePerPortion": 1500 },
        { "id": "ensalada-rusa", "name": "Ensalada Rusa", "portionGrams": 120, "pricePerPortion": 1800 }
      ]
    },
    {
      "id": "salsas",
      "label": "Salsas",
      "maxItems": 3,
      "items": [
        { "id": "salsa-rosada", "name": "Salsa Rosada", "portionGrams": 30, "pricePerPortion": 300 },
        { "id": "chimichurri", "name": "Chimichurri", "portionGrams": 30, "pricePerPortion": 350 },
        { "id": "hogao", "name": "Hogao Casero", "portionGrams": 40, "pricePerPortion": 400 }
      ]
    },
    {
      "id": "bebidas",
      "label": "Bebida",
      "maxItems": 1,
      "items": [
        { "id": "limonada-natural", "name": "Limonada Natural", "portionGrams": 350, "pricePerPortion": 3000, "unit": "ml" },
        { "id": "jugo-mora", "name": "Jugo de Mora", "portionGrams": 350, "pricePerPortion": 3200, "unit": "ml" },
        { "id": "agua", "name": "Agua en Botella", "portionGrams": 500, "pricePerPortion": 1500, "unit": "ml" }
      ]
    }
  ],
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### Colección: `quotations`

```json
{
  "_id": "ObjectId",
  "menuId": "ObjectId",
  "clientInfo": {
    "name": "Laura Martínez",
    "phone": "+57 311 234 5678",
    "email": "laura@gmail.com",
    "eventType": "Boda",
    "eventDate": "2025-08-15",
    "fcmToken": "token-del-dispositivo-del-cliente"
  },
  "selectedItems": [
    {
      "categoryId": "proteinas",
      "categoryLabel": "Proteína",
      "itemId": "pechuga-plancha",
      "itemName": "Pechuga a la Plancha",
      "portionGrams": 200,
      "pricePerPortion": 4500
    },
    {
      "categoryId": "carbohidratos",
      "categoryLabel": "Carbohidrato",
      "itemId": "arroz-blanco",
      "itemName": "Arroz Blanco",
      "portionGrams": 150,
      "pricePerPortion": 1200
    },
    {
      "categoryId": "ensaladas",
      "categoryLabel": "Ensalada",
      "itemId": "ensalada-mixta",
      "itemName": "Ensalada Mixta",
      "portionGrams": 100,
      "pricePerPortion": 1500
    },
    {
      "categoryId": "salsas",
      "categoryLabel": "Salsas",
      "itemId": "chimichurri",
      "itemName": "Chimichurri",
      "portionGrams": 30,
      "pricePerPortion": 350
    },
    {
      "categoryId": "bebidas",
      "categoryLabel": "Bebida",
      "itemId": "limonada-natural",
      "itemName": "Limonada Natural",
      "portionGrams": 350,
      "pricePerPortion": 3000
    }
  ],
  "numberOfPeople": 100,
  "pricePerPlate": 10550,
  "totalPrice": 1055000,
  "status": "pending",
  "adminNotes": "",
  "editHistory": [
    {
      "editedBy": "client",
      "editedAt": "ISODate",
      "previousItems": ["chuleta-cerdo"],
      "newItems": ["pechuga-plancha"],
      "reason": "Cliente cambió proteína"
    }
  ],
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## 9. API Endpoints (NestJS)

### Auth
```
POST /auth/admin/login          → JWT para admin
POST /auth/client/access        → Token temporal por link de evento
```

### Menús
```
GET    /menus                   → Listar menús (admin)
POST   /menus                   → Crear menú (admin)
GET    /menus/:slug             → Ver menú público (cliente)
PATCH  /menus/:id               → Editar menú (admin)
POST   /menus/:id/items         → Agregar ítem a categoría (admin)
PATCH  /menus/:id/items/:itemId → Editar ítem específico (admin)
DELETE /menus/:id/items/:itemId → Eliminar ítem (admin)
```

### Cotizaciones
```
POST   /quotations              → Cliente crea cotización
GET    /quotations              → Admin ve todas las cotizaciones
GET    /quotations/:id          → Ver detalle (admin o cliente propietario)
PATCH  /quotations/:id          → Editar plato (admin O cliente) ← CLAVE
PATCH  /quotations/:id/status   → Admin cambia estado (approve/reject)
GET    /quotations/:id/history  → Ver historial de cambios ← NUEVO
```

### Notificaciones
```
POST /notifications/send        → Disparo manual (admin)
GET  /notifications/history     → Historial de notificaciones de una cotización
```

---

## 10. Lógica de Notificaciones — Completa

### Mapa de notificaciones por evento

| Evento | Quién recibe | Mensaje |
|--------|-------------|---------|
| Cliente confirma cotización | **Admin** | "📋 Nueva cotización de [Nombre] — [N] personas — $[Total]" |
| Cliente confirma cotización | **Cliente** | "✅ Tu cotización fue enviada. Te avisamos cuando el chef la revise." |
| Admin aprueba sin cambios | **Cliente** | "🎉 ¡Tu menú fue aprobado! Todo listo para el [fecha del evento]." |
| Admin edita el plato | **Cliente** | "✏️ El chef ajustó tu selección. Entra a revisar los cambios y confírmalos." |
| Admin rechaza | **Cliente** | "❌ El chef no puede preparar esa selección. Contáctanos para buscar alternativas." |
| **Cliente edita plato ya enviado** | **Admin** | "🔄 [Nombre] modificó su plato. Revisa los cambios antes de aprobar." |
| Cliente confirma cambios del admin | **Admin** | "✅ [Nombre] aceptó los cambios. Cotización lista para confirmar." |
| Confirmación final (ambos de acuerdo) | **Ambos** | "🍽️ ¡Menú confirmado! Nos vemos el [fecha]." |

### Implementación en NestJS

```typescript
// notifications/notifications.service.ts

import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  async sendToAdmin(payload: NotificationPayload): Promise<void> {
    const adminToken = await this.adminsService.getFcmToken();
    await admin.messaging().send({
      token: adminToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        quotationId: payload.quotationId,
        type: payload.type, // 'new_quotation' | 'client_edited' | 'client_confirmed'
      },
    });
  }

  async sendToClient(clientFcmToken: string, payload: NotificationPayload): Promise<void> {
    // Si el cliente no tiene app aún, fallback a email
    if (!clientFcmToken) {
      await this.emailService.sendQuotationEmail(payload);
      return;
    }
    await admin.messaging().send({
      token: clientFcmToken,
      notification: { title: payload.title, body: payload.body },
      data: { quotationId: payload.quotationId, type: payload.type },
    });
  }
}
```

### Hook de notificaciones en React Native

```typescript
// hooks/useNotification.ts
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';

export function useNotification() {
  const navigation = useNavigation();

  useEffect(() => {
    // Notificación en foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const { type, quotationId } = remoteMessage.data;
      
      if (type === 'admin_edited') {
        showBanner('El chef ajustó tu plato', 'Toca para revisar', () =>
          navigation.navigate('QuotationDetail', { id: quotationId })
        );
      }
      if (type === 'approved') {
        showSuccessBanner('¡Tu menú fue aprobado! 🎉');
      }
    });

    // Notificación cuando app estaba cerrada
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage?.data?.quotationId) {
        navigation.navigate('QuotationDetail', { id: remoteMessage.data.quotationId });
      }
    });

    return unsubscribe;
  }, []);
}
```

---

## 11. Lógica de Cálculo de Precio

```typescript
// packages/utils/src/pricing.ts

export interface SelectedItem {
  itemId: string;
  itemName: string;
  categoryLabel: string;
  pricePerPortion: number;
  portionGrams: number;
}

export function calculateQuotation(
  selectedItems: SelectedItem[],
  numberOfPeople: number
): {
  pricePerPlate: number;
  totalPrice: number;
  breakdown: { category: string; item: string; price: number }[];
} {
  const breakdown = selectedItems.map(item => ({
    category: item.categoryLabel,
    item: item.itemName,
    price: item.pricePerPortion,
  }));

  const pricePerPlate = selectedItems.reduce(
    (sum, item) => sum + item.pricePerPortion, 0
  );

  const totalPrice = pricePerPlate * numberOfPeople;

  return { pricePerPlate, totalPrice, breakdown };
}

/*
  Ejemplo real:
  Pechuga a la Plancha  → $4.500
  Arroz Blanco          → $1.200
  Ensalada Mixta        → $1.500
  Chimichurri           → $350
  Limonada Natural      → $3.000
  ─────────────────────────────
  Precio por plato      → $10.550
  100 personas          → $1.055.000
*/
```

---

## 12. UI/UX — Diseño Visual

### Estilo: Glassmorphism sobre fondo oscuro gastronómico
- Fondo: gradiente `#0f0c29 → #302b63 → #24243e`
- Cards: `backdrop-filter: blur(16px); background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15)`
- Tipografía: `Poppins` o `Inter`
- Colores: Dorado `#f5c842` para CTAs, Verde `#4ecb71` para confirmaciones, Rojo `#e85555` para rechazos

### Pantallas Mobile (Cliente)

```
1. Splash / Bienvenida (logo + acceso por link del evento)
2. Categorías en carrusel horizontal (Proteína, Carbohidrato...)
3. Selector de ítem — imagen grande, nombre, peso, precio por porción
4. PLATO VISUAL en centro — ítems van apareciendo con animación
5. [EDITAR] — toca un ítem del plato → modal de reemplazo ← NUEVO
6. Número de personas (slider + input numérico)
7. Resumen + cotización total con desglose por ítem
8. Formulario del cliente (nombre, teléfono, tipo de evento, fecha)
9. Confirmación enviada + badge de estado
10. Vista de cotización activa — muestra estado + permite editar si está en pending/edited
```

### Pantallas Web Admin

```
1. Login
2. Dashboard — métricas: cotizaciones pendientes, aprobadas, valor total del mes
3. Lista de cotizaciones con filtro por estado
4. Detalle de cotización — plato, precio, cliente
5. Panel de edición — reemplazar ítems, ajustar porciones ← NUEVO
6. Comparación antes/después cuando el cliente editó algo ← NUEVO
7. Historial de cambios (timeline) ← NUEVO
8. Gestión de menús — CRUD de categorías e ítems
```

---

## 13. Buenas Prácticas de Código

### Backend (NestJS)
- DTOs con `class-validator` para todo lo que entra por la API
- Módulos separados: `AuthModule`, `MenuModule`, `QuotationModule`, `NotificationModule`
- Guards para rutas de admin (`JwtAuthGuard`, `RolesGuard`)
- Interceptor global de logs con `Pino`
- Manejo de errores con `HttpException` y `ExceptionFilter` global
- Variables de entorno con `@nestjs/config`
- El campo `editedBy` en cada operación PATCH para trazabilidad

### Frontend (React Native / Next.js)
- Zustand para estado global del plato en construcción
- React Query para sync con la API y revalidación automática
- Reanimated 3 para animaciones del plato (60fps garantizados)
- Custom hooks separados: `usePlateEditor`, `useQuotation`, `useNotification`
- Componente `EditItemModal` reutilizable en mobile y web

### General
- TypeScript estricto en todo el monorepo
- Conventional commits: `feat:`, `fix:`, `chore:`, `notify:`
- ESLint + Prettier configurados desde el root
- Swagger auto-generado con decoradores NestJS (`@ApiProperty`, `@ApiOperation`)
- Variables de entorno por ambiente: `.env.development`, `.env.production`

---

## 14. Plan de Sprints

### 🏃 Sprint 0 — Setup (3-4 días)
- [ ] Monorepo con Turborepo
- [ ] Setup NestJS + MongoDB Atlas
- [ ] Setup Next.js 14 (web admin)
- [ ] Setup Expo (React Native)
- [ ] ESLint, Prettier, TypeScript estricto
- [ ] Deploy inicial Railway (API) + Vercel (web)

### 🏃 Sprint 1 — Auth + Menús Admin (1 semana)
- [ ] Login admin con email/password + JWT
- [ ] CRUD de menús con categorías e ítems (nombres, precios, pesos, imágenes)
- [ ] Upload de imágenes a Cloudinary
- [ ] Endpoint público `GET /menus/:slug` para el cliente
- [ ] Vista admin: lista y edición de menús

### 🏃 Sprint 2 — Flujo del Cliente Mobile (1.5 semanas)
- [ ] App mobile: acceso por link/QR
- [ ] Carrusel de categorías
- [ ] Selector de ítem con imagen, nombre, precio y peso
- [ ] Animación del plato componiéndose en el centro (Reanimated 3)
- [ ] Vista del plato armado completo

### 🏃 Sprint 3 — Edición del Plato por Cliente (1 semana) ← NUEVO
- [ ] Toque sobre ítem del plato → abre `EditItemModal`
- [ ] Reemplazo de ítem en la misma categoría
- [ ] Recálculo inmediato de precio al editar
- [ ] Validaciones: no editar si `status === 'rejected'`
- [ ] Warning antes de editar una cotización ya enviada

### 🏃 Sprint 4 — Cotización y Confirmación (1 semana)
- [ ] Slider de número de personas
- [ ] Cálculo automático en tiempo real (precio por plato × personas)
- [ ] Pantalla de resumen con desglose por ítem
- [ ] Formulario de datos del cliente
- [ ] POST /quotations a la API

### 🏃 Sprint 5 — Notificaciones Completas (1 semana)
- [ ] Firebase Cloud Messaging setup en NestJS y React Native
- [ ] Notificación al admin cuando cliente confirma cotización
- [ ] Notificación al cliente cuando admin aprueba, edita o rechaza
- [ ] Notificación al admin cuando **cliente edita después de enviar** ← NUEVO
- [ ] Fallback a email con Resend si cliente no tiene token FCM

### 🏃 Sprint 6 — Panel Admin con Edición Bilateral (1 semana)
- [ ] Dashboard admin con métricas y lista de cotizaciones por estado
- [ ] Vista detallada de cotización
- [ ] Admin puede editar ítems del plato del cliente → dispara notificación
- [ ] Timeline/historial de cambios de cada cotización ← NUEVO
- [ ] Vista comparación: antes/después de edición ← NUEVO
- [ ] Botones: Aprobar / Editar / Rechazar

### 🏃 Sprint 7 — Bebidas + Pulido Final (1 semana)
- [ ] Categoría bebidas con mismo flujo visual (ítem, nombre, volumen, precio)
- [ ] Glassmorphism completo en mobile y web
- [ ] QR dinámico por menú
- [ ] Swagger documentado
- [ ] Testing básico con Jest (API) y RNTL (mobile)

### 🚀 Sprint 8+ — Escalabilidad
- [ ] Multi-tenant: otros caterers/restaurantes pueden tener su cuenta
- [ ] Pasarela de pago Wompi / PayU Colombia para depósito de reserva
- [ ] Analytics: platos más solicitados, proteína más popular, etc.
- [ ] Versión PWA para cliente sin necesidad de instalar app
- [ ] WhatsApp Business API como canal de notificación adicional

---

## 15. Sistemas Similares en el Mercado — Guía de Referencia

Estas plataformas ya existen y hacen cosas parecidas. Estudiarlas te ayuda a entender qué funciona, qué falta en el mercado colombiano, y cómo diferenciarse.

---

### 🥇 Tripleseat — El más parecido en concepto

**¿Qué es?** Plataforma de gestión de eventos para restaurantes, hoteles y catering. Flujo completo desde captura del lead hasta confirmación del evento.

**Qué tiene en común con tu proyecto:**
- Propuestas de menú que el cliente puede revisar y firmar
- Estados de la cotización con historial
- Notificaciones automáticas entre el venue y el cliente
- Panel admin para gestión de múltiples eventos simultáneos

**Qué le falta vs tu idea:**
- No tiene el "armado visual del plato" ítem por ítem
- No hay animación visual de qué queda en el plato
- No está pensado para el mercado colombiano (precios en USD, sin PSE/Wompi)
- Cuesta ~$499/mes, inaccesible para pequeños caterers

**URL:** tripleseat.com  
**Lo que aprender de él:** La estructura de estados de una cotización y el flujo de aprobación/firma digital.

---

### 🥈 HoneyBook — El más amigable con el cliente

**¿Qué es?** CRM para freelancers y pequeños negocios creativos. Muy usado por fotógrafos, floristas y caterers pequeños.

**Qué tiene en común:**
- Propuestas visuales que el cliente puede ver y aprobar en línea
- Notificaciones automáticas al negocio cuando el cliente actúa
- Formularios de datos del cliente integrados al flujo

**Qué le falta:**
- Sin builder de plato por porciones ni visualización gastronómica
- No tiene seguimiento de ingredientes ni costeo de menú
- Tampoco pensado para Colombia

**URL:** honeybook.com  
**Lo que aprender:** El diseño limpio de la propuesta que el cliente ve. La experiencia del cliente en HoneyBook es muy pulida.

---

### 🥉 CaterCamp — El más específico para catering

**¿Qué es?** CRM completo para caterers: menú builder, BEOs (Banquet Event Orders), costeo de comida, staff scheduling. $99/mes.

**Qué tiene en común:**
- Constructor de menú con categorías
- Cotización automática por número de personas
- Vista compartida admin/cliente del evento

**Qué le falta:**
- No tiene visualización animada del plato
- Interface anticuada
- No disponible en español ni adaptado a Colombia

**URL:** catercamp.com  
**Lo que aprender:** El modelo de datos de un menú de catering con BEO. Cómo estructuran las categorías y subcategorías.

---

### 🍽️ Toast Catering & Events — El más integrado con POS

**¿Qué es?** Módulo de catering de Toast (el POS más popular en restaurantes USA). Permite crear cotizaciones que el cliente aprueba online.

**Qué tiene en común:**
- "EventView": página web personalizada con todos los detalles del evento para que el cliente revise
- Cotización online con aprobación del cliente
- Integración con pagos

**Lo que aprender:** La idea de una "página de evento" única por cliente es interesante. En tu caso podría ser el link único que tu cliente le manda al cliente por WhatsApp.

---

### 📊 Tabla comparativa

| Feature | Tu App | Tripleseat | HoneyBook | CaterCamp | Toast |
|---------|--------|-----------|-----------|-----------|-------|
| Armado visual del plato | ✅ | ❌ | ❌ | ❌ | ❌ |
| Animación ítem por ítem | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edición por cliente | ✅ | Parcial | Parcial | ❌ | ❌ |
| Notificación bilateral | ✅ | ✅ | ✅ | Parcial | ✅ |
| Historial de cambios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Precio en COP | ✅ | ❌ | ❌ | ❌ | ❌ |
| App mobile para cliente | ✅ | ❌ | Parcial | ❌ | ❌ |
| Precio para PYME | 💲 | 💲💲💲 | 💲💲 | 💲💲 | 💲💲💲 |

**Tu ventaja competitiva real:** Ninguno de los competidores tiene el **armado visual del plato con animación**. Esa es la experiencia diferenciadora. El cliente ve su plato armándose como si estuviera en un restaurante eligiendo lo que quiere. Eso es lo que hay que cuidar y pulir.

---

## 16. Para el Mockup Visual

Herramienta recomendada para mostrarle a tu cliente:

| Herramienta | Costo | Para qué sirve |
|-------------|-------|---------------|
| **Figma** (recomendado) | Gratis | Mockup completo, prototipo clicable, presentación al cliente |
| **Framer** | Gratis/paid | Si quieres animaciones en el prototipo |
| **Excalidraw** | Gratis | Flujos rápidos tipo boceto para planear |
| **Whimsical** | Freemium | Flowcharts + wireframes muy rápidos |

**Pantallas clave para el mockup (en orden):**
1. Splash de bienvenida
2. Carrusel de categorías (Proteína, Carbohidrato, Ensalada, Salsas, Bebida)
3. Selector de ítem con imagen grande (ej: "Pechuga a la Plancha — 200g — $4.500")
4. **Plato visual en construcción** — el centro de la pantalla con los ítems acumulándose
5. Pantalla de cotización con total y desglose
6. Modal de edición de ítem ("¿Cambiar Chuleta por Pechuga?")
7. Panel admin — lista de cotizaciones con estados
8. Detalle de cotización con botones Aprobar / Editar / Rechazar

---

## 17. Resumen Ejecutivo para tu cliente

> "La app permite que tus clientes entren a un link que tú les mandas, escojan cada parte de su plato por nombre y porción — la carne, el arroz, la ensalada, las salsas, la bebida — y vean en tiempo real cómo el plato se va armando visualmente. Si se equivocaron escogiendo algo, lo pueden cambiar ahí mismo. Al terminar, el sistema calcula el precio total según el número de personas y te manda una notificación con todos los detalles. Tú puedes aprobar, ajustar o rechazar desde tu panel, y el cliente también recibe notificación de cada cambio. Todo queda registrado con historial de modificaciones para que ambos sepan exactamente en qué quedaron. En el futuro se puede abrir como servicio para otros caterers y restaurantes en Colombia."

---

*Documento generado — Menu Digital v2.0*  
*Brikman Paul Morales — JC TECH — Junio 2025*
