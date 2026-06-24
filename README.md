# AromaSabor

Collaborative menu proposal platform for caterers and banquet halls.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, Zustand, TanStack Query, Framer Motion |
| Backend | NestJS 11, Mongoose, MongoDB Atlas |
| Auth | JWT (httpOnly cookies) |
| QR | `qrcode` npm package |
| Monorepo | Turborepo + pnpm |

## Quick Start

```bash
pnpm install
pnpm dev
```

- API: http://localhost:4000/api
- Web: http://localhost:3000

## Project Structure

```
aromasabor/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── shared-types/ # TypeScript interfaces
│   └── utils/        # Shared utilities (pricing engine)
├── docker-compose.yml
└── turbo.json
```

## Architecture

```
┌────────────┐     ┌──────────────┐     ┌─────────────┐
│  Browser   │ ──► │  Next.js 15  │ ──► │  NestJS API  │
│  (Client)  │     │  (Frontend)  │     │  (Backend)   │
└────────────┘     └──────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │   MongoDB   │
                                        │   (Atlas)   │
                                        └─────────────┘
```
