# Story 1 — Admin Login

> **Sprint:** 1 (Week 1, Days 1–5)
> **Status:** ✅ Complete
> **Date:** 2026-06-24

---

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `apps/web/lib/api.ts` | Fetch wrapper con `credentials: 'include'`, manejo de errores uniforme, métodos GET/POST/PATCH/DELETE |
| `apps/web/app/(admin)/layout.tsx` | Layout protegido — verifica JWT vía `GET /auth/me`, redirige a `/login` si 401 |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/api/src/modules/auth/auth.service.ts` | Se agregó `register()` (crea admin con bcrypt hash + JWT) y `getProfile()` (retorna admin sin passwordHash) |
| `apps/api/src/modules/auth/auth.controller.ts` | Se agregaron endpoints `POST /auth/register`, `POST /auth/logout`, `GET /auth/me`. `POST /auth/login` ahora setea httpOnly cookie en lugar de devolver token en body |
| `apps/web/app/(admin)/login/page.tsx` | De stub estático a formulario funcional con toggle login/register, validación, loading state, manejo de errores |
| `apps/web/app/(admin)/dashboard/page.tsx` | Muestra nombre del admin, botón de logout que limpia cookie |
| `turbo.json` | `pipeline` → `tasks` (compatibilidad Turbo 2.x) |
| `apps/web/app/(public)/menu/[slug]/page.tsx` | Parámetros `params` como `Promise` (Next.js 15) |
| `apps/web/app/(public)/prop/[token]/page.tsx` | Parámetros `params` como `Promise` (Next.js 15) |
| `.env` | Creado desde `.env.example` |
| `apps/api/package.json` | Agregado `@types/express` como devDependency |

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Crea admin, setea cookie JWT |
| `POST` | `/api/auth/login` | No | Valida credenciales, setea cookie JWT |
| `POST` | `/api/auth/logout` | No | Limpia cookie JWT |
| `GET` | `/api/auth/me` | JWT | Retorna admin autenticado (sin passwordHash) |

## Flujo de autenticación

```
Register/Login
  │
  ▼
POST /api/auth/register  (o /login)
  │
  ▼
Servidor valida → firma JWT (sub, email, role)
  │
  ▼
Responde con Set-Cookie: access_token=<jwt>; HttpOnly; Path=/; SameSite=Lax
  │
  ▼
Cliente redirige a /dashboard

Peticiones siguientes:
  │
  ▼
Cookie access_token se envía automáticamente
  │
  ▼
JwtStrategy extrae de cookie → valida firma → payload → request.user
  │
  ▼
JwtAuthGuard permite/deniega acceso

Logout:
  │
  ▼
POST /api/auth/logout → Set-Cookie: access_token=; Max-Age=0
  │
  ▼
Redirige a /login
```

## Pruebas realizadas

- ✅ `pnpm typecheck` — pasa en los 4 packages (shared-types, utils, api, web)
- ✅ `pnpm build` — API compila (NestJS build), Web compila (Next.js build, 8 rutas generadas)
- ✅ Lógica de `auth.service.ts` validada por TypeScript (tipados correctos)
- ✅ Cookie options configurados: `httpOnly`, `secure` en producción, `sameSite: lax`

## Pasos para probar manualmente

### Prerrequisitos

```bash
# Terminal 1: Iniciar MongoDB
docker compose up mongodb -d

# Terminal 2: Iniciar API
pnpm dev --filter=api

# Terminal 3: Iniciar Web
pnpm dev --filter=web
```

### Flujo completo

1. Abrir `http://localhost:3000`
2. Click "Admin Login" → navega a `/login`
3. Click "Register" → completar email, name, password → submit
4. Redirige a `/dashboard` → muestra "Welcome, {name}"
5. Click "Logout" → redirige a `/login`
6. Ingresar mismo email + password → click "Sign In"
7. Redirige a `/dashboard` nuevamente
8. Abrir `/dashboard` directamente en otra ventana → funciona (cookie activa)
9. Limpiar cookies → recargar `/dashboard` → redirige a `/login`
