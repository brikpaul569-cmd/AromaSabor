# Architecture — AromaSabor MVP

---

## Monorepo Structure

```
aromasabor/
├── apps/
│   ├── api/                        # NestJS 11 backend
│   │   ├── src/
│   │   │   ├── main.ts             # Entry point: CORS, cookie-parser, ValidationPipe, global filter
│   │   │   ├── app.module.ts       # Root module: imports Config, Mongoose, Auth, Menus, Proposals, Notifications
│   │   │   ├── common/
│   │   │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   │   │   ├── filters/        # AllExceptionsFilter (global error handler)
│   │   │   │   └── decorators/     # CurrentUser, Roles
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # Login, JWT signing, Passport strategy
│   │   │   │   ├── menus/          # Menu CRUD
│   │   │   │   ├── proposals/      # Proposal CRUD + token generation
│   │   │   │   └── notifications/  # In-app notification CRUD
│   │   │   └── schemas/            # Mongoose schemas (Admin, Menu, Proposal, Notification)
│   │   ├── Dockerfile
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                        # Next.js 15 frontend
│       ├── app/
│       │   ├── layout.tsx          # Root layout: Inter font, Providers wrapper
│       │   ├── page.tsx            # Landing page
│       │   ├── globals.css         # Tailwind directives + dark theme variables
│       │   ├── providers.tsx       # TanStack Query provider
│       │   ├── (admin)/
│       │   │   ├── login/          # Admin login form
│       │   │   ├── dashboard/      # Proposal list
│   │   │   ├── menus/          # Menu management
│   │   │   │   ├── [id]/       # Menu editor (items, publish)
│   │   │   │   └── new/        # Create menu form
│   │   │   └── proposals/      # Proposal management
│       │   └── (public)/
│       │       ├── menu/[slug]/    # Public menu view
│       │       └── prop/[token]/   # Client proposal view (Visual Plate Composer)
│       ├── lib/
│       │   ├── api.ts             # Fetch wrapper (credentials: include, error handling)
│       │   └── utils.ts           # cn() helper (clsx + tailwind-merge)
│       ├── components/            # Reusable UI (custom dark-theme components)
│       ├── hooks/                  # Custom React hooks
│       ├── stores/                 # Zustand stores (Visual Plate Composer)
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared-types/               # TypeScript interfaces shared by API + Web
│   │   └── src/index.ts           # Admin, Menu, MenuItem, Proposal, ProposalItem, Notification, Auth, API
│   │
│   └── utils/                      # Pure utility functions
│       └── src/
│           ├── pricing.ts          # calculateQuotation() — 16% IVA, half-up rounding
│           └── index.ts            # Public exports
│
├── docker-compose.yml              # MongoDB 7 + API service
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
├── .prettierrc
├── .env.example
└── README.md
```

---

## Frontend Flow

```
Browser Request
       │
       ▼
  Next.js 15 App Router
       │
       ├── Public Routes  ──→  (public)/
       │   │                     ├── menu/[slug]    → Menu view (no auth)
│       │                     └── prop/[token]   → Proposal + Visual Plate Composer (token-based)
       │
       └── Admin Routes  ──→  (admin)/
                                ├── login           → Email + password form
                                ├── dashboard       → Proposal list (JWT required)
                                ├── menus           → Menu CRUD (JWT required)
                                └── proposals       → Proposal management (JWT required)
```

### Auth Flow

```
Login form (email + password)
       │
       ▼
POST /api/auth/login
       │
       ▼
JWT returned → stored in httpOnly cookie (access_token)
       │
       ▼
Subsequent requests: cookie auto-attached → JwtAuthGuard validates → user attached to request
```

### Client Proposal Flow

```
Chef generates token URL
       │
       ▼
Client opens /prop/:token
       │
       ▼
GET /api/proposals/:token
       │
       ▼
If valid + not expired → Show Visual Plate Composer (items, quantities, live pricing)
If expired → Show "This proposal has expired. Request a new version."
```

---

## Backend Flow

```
HTTP Request
       │
       ▼
  NestJS App (main.ts)
       │
       ├── Global Prefix: /api
       ├── CORS: web origin only, credentials: true
       ├── Cookie-parser: reads access_token from cookie
       ├── ValidationPipe: whitelist + transform
       └── AllExceptionsFilter: catches all errors → uniform JSON response
              │
              ▼
         AppModule
              │
              ├── ConfigModule (global .env)
              ├── MongooseModule (MongoDB Atlas URI)
              ├── AuthModule      → /api/auth/*
              ├── MenusModule     → /api/menus/*
              ├── ProposalsModule → /api/proposals/*
              └── NotificationsModule → /api/notifications/*
```

### Module Architecture (per module)

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌─────────┐
│ Controller│ ──► │  Service  │ ──► │  Mongoose     │ ──► │ MongoDB │
│ (routes)  │     │ (logic)   │     │  Model/Schema │     │         │
└──────────┘     └───────────┘     └──────────────┘     └─────────┘
                      │
                      ▼
               Other services
               (e.g. NotificationsService
                called from ProposalsService)
```

### JWT Auth Flow (Guard Layer)

```
Request → Cookie/Header → JwtStrategy.validate()
                                 │
                                 ▼
                         payload { sub, email, role }
                                 │
                                 ▼
                         request.user = { _id, email, role }
                                 │
                                 ▼
                         JwtAuthGuard or RolesGuard
                                 │
                                 ▼
                         Controller handler
```

---

## Shared Types

Single source of truth in `packages/shared-types/src/index.ts`.

Used by:
- **API** via `@aromasabor/shared-types` (for controller DTOs)
- **Web** via `@aromasabor/shared-types` (for API response typing)
- **Utils** via `@aromasabor/shared-types` (for function parameter types)

Types defined:
- `Admin`, `Menu`, `MenuItem`, `Proposal`, `ProposalItem`, `EditHistoryEntry`, `Notification`
- `CategoryType`, `ProposalStatus`, `EditorRole`, `NotificationType`
- `LoginRequest`, `LoginResponse`, `ApiError`, `PaginatedResponse`

---

## Pricing Engine

`packages/utils/src/pricing.ts` — pure function, zero dependencies.

```
Input:  items: QuotationItem[]    [{ price, quantity }]
Output: { subtotal, tax, total }

Rules:
  1. Line total = price × quantity
  2. Subtotal = Σ line totals
  3. Tax = 16% IVA, half-up to 2 decimals
  4. Total = subtotal + tax
  5. Empty list → all zeros
  6. Throws on negative price or quantity < 1
```

Called by:
- `ProposalsService.create()` — stores result in `proposal.quotation`
- Web client — live preview before saving

---

## Conventions

### Naming
- **Files:** `kebab-case.ts` (e.g., `jwt-auth.guard.ts`, `current-user.decorator.ts`)
- **Classes:** PascalCase (e.g., `JwtAuthGuard`, `AuthService`)
- **Variables/functions:** camelCase (e.g., `calculateQuotation`, `findByToken`)
- **Mongoose schemas:** PascalCase model class, `ModelNameSchema` for factory output
- **MongoDB collections:** plural snake_case (auto-generated by Mongoose from model name)
- **API routes:** plural kebab-case (e.g., `/api/menus`, `/api/proposals/:token`)
- **Enum values (business):** Spanish snake_case (e.g., `'plato_fuerte'`, `'borrador'`)
- **Enum values (system):** English snake_case (e.g., `'proposal_created'`, `'proposal_expired'`)

### Code style
- No comments in implementation code (JSDoc only in shared packages like `pricing.ts`)
- Strict TypeScript: `strict: true`, `noUncheckedIndexedAccess: true`
- `import` type when only using type information
- Services inject dependencies via constructor (`@Injectable()`)
- Controllers are thin: validate input, call service, return result

### Module structure (per NestJS module)
```
src/modules/{name}/
├── {name}.module.ts      # @Module({ imports, controllers, providers, exports })
├── {name}.controller.ts   # Routes, guards, response shape
└── {name}.service.ts      # Business logic, database calls
```

### Git workflow
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Branch: `develop` for integration, feature branches off `develop`
- PR target: `develop` → `main` for releases

### Error handling
- Global filter returns `{ statusCode, error, message, timestamp, path }` for all responses
- Guards throw `UnauthorizedException` (401)
- Services throw `NotFoundException` (404) for missing resources
- Invalid state transitions return HTTP 409 Conflict
- Validation errors return 400 with field-level messages
