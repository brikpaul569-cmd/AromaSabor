# Engram Memory Record — AromaSabor

> **Purpose:** Persistent project memory for AI-assisted development
> **Binary:** `C:\Users\brik3\Documents\Desarrollos\engram-bin\engram_1.17.0_windows_amd64`
> **Last save:** Observation #5

---

## 1. Project Identity

```
Name:        AromaSabor
Type:        SaaS Web Platform
Industry:    Catering / Banquet halls / Gastronomic events
Repository:  (to be created — GitHub)
Monorepo:    Turborepo (pnpm)
```

---

## 2. Business Context

### Problem
Banquet halls and caterers manually manage menu proposals via WhatsApp, calls, and emails. No traceability, no visual experience, no collaborative negotiation.

### Solution
A web platform where chefs create digital menus, send time-limited proposals to clients, and collaboratively negotiate via a visual plate builder.

### Key Business Rules
1. Menus are **permanent** — they never expire.
2. Proposals **expire** — default 20 minutes (hardcoded for MVP).
3. Both chef and client can **edit** the proposal.
4. Each edit generates an **in-app notification**.
5. The **Plate Builder Visual** is the core differentiator.
6. MVP is **web-only** (Next.js 15 + NestJS).
7. No mobile app, no Socket.IO, no WhatsApp, no OTP, no FCM.

---

## 3. Approved MVP Scope — 20 Stories

### Track 1 — Auth + Menus (Sprint 1)
1. Admin login with email + password, JWT httpOnly cookie
2. Create menu with name and unique slug
3. Add categories (label, maxItems limit)
4. Add items (name, image URL, portion grams, price per portion)
5. Publish menu (activate, public URL)

### Track 2 — Plate Builder (Sprint 2-3)
6. View public menu with categories and items
7. Select items by tapping categories
8. Visual plate: items stack in centered view with CSS animations
9. Replace or remove items from the plate
10. Adjust number of people for real-time price update
11. Live price per plate and total price with breakdown

### Track 3 — Proposals (Sprint 4-5)
12. Chef creates a proposal in DRAFT (pre-selects items, sets client/event info)
13. Chef sends proposal → status SENT, generates UUID token, starts 20min timer
14. Client opens `/prop/:token` → sees Plate Builder, status becomes ACTIVE
15. Cron job expires proposals every 30s → EXPIRED screen (no content visible)
16. Chef downloads QR code for any sent/active proposal

### Track 4 — Negotiation (Sprint 6-7)
17. Client edits proposal → MODIFIED_BY_CLIENT, chef notified
18. Chef edits proposal from dashboard → MODIFIED_BY_CHEF, client sees banner
19. Either party approves (APPROVED) or rejects (REJECTED) — terminal states
20. In-app notification panel for chef (title, message, timestamp, proposal link, unread badge)

### Explicitly NOT in MVP
- Cloudinary image upload (paste URL)
- Configurable expiration (hardcode 20 min)
- Manual revocation / extend timer
- Client email/phone fields
- Edit history diff UI
- Dashboard metrics
- Mobile app
- Socket.IO
- FCM / Push
- WhatsApp / OTP
- Multi-tenant
- Advanced watermarks
- Automated tests (manual testing only)

---

## 4. Technology Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Monorepo | Turborepo + pnpm | Shared types, incremental builds |
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Rapid UI development, SSR |
| Backend | NestJS + Mongoose | Modular, TypeScript-native |
| Database | MongoDB Atlas (free tier) | Flexible documents, free tier |
| Auth | JWT + bcrypt + httpOnly cookie | Simple, no third-party dependency |
| QR | `qrcode` npm package | Zero external API dependency |
| State | Zustand | Lightweight, no boilerplate |
| API client | TanStack Query (React Query) | Caching, refetch, stale-while-revalidate |
| Animations | CSS transitions + Framer Motion | No React Native dependency |
| CI/CD | GitHub Actions | Free for public/private repos |
| Hosting | Railway (API) + Vercel (Web) | Free tier, simple deploy |

---

## 5. Sprint Plan

```
Sprint 1 (2 weeks) → Stories 1-5   (Auth + Menus)
Sprint 2 (2 weeks) → Stories 6-8   (Plate Builder: view + select + visual)
Sprint 3 (2 weeks) → Stories 9-11  (Plate Builder: replace + qty + pricing)
Sprint 4 (1 week)  → Stories 12-13 (Proposal: create + send)
Sprint 5 (1 week)  → Stories 14-16 (Proposal: access + expiration + QR)
Sprint 6 (1 week)  → Stories 17-18 (Negotiation: edits)
Sprint 7 (1 week)  → Stories 19-20 (Negotiation: approve/reject + notifications)
```

---

## 6. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  apps/web (Next.js 15)                               │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ (admin)/          │  │ (public)/                │  │
│  │   login           │  │   menu/[slug]            │  │
│  │   dashboard       │  │   prop/[token]           │  │
│  │   menus           │  │   prop/[token]/expired   │  │
│  │   proposals       │  │                          │  │
│  │   notifications   │  │   PlateBuilder (shared)  │  │
│  └──────────────────┘  └──────────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │ REST API
┌──────────────────────▼───────────────────────────────┐
│  apps/api (NestJS)                                    │
│  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Auth    │ │ Menu   │ │ Proposal │ │ Notification│ │
│  │ Module  │ │ Module │ │ Module   │ │ Module     │ │
│  └─────────┘ └────────┘ └──────────┘ └────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Common: Guards, Filters, Pipes, Decorators      │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │
               MongoDB Atlas
```

---

## 7. Domain Model (Final — MVP)

### Menu (permanent)
```
_id, name, slug, adminId, isActive, categories[], createdAt, updatedAt
```
- `categories[]`: `{id, label, maxItems, required, items[]}`
- `items[]`: `{id, name, imageUrl?, portionGrams, pricePerPortion, unit, isAvailable}`

### Proposal (expires)
```
_id, menuId, adminId, token (UUID),
clientName, eventName, numberOfPeople,
selectedItems[], pricePerPlate, totalPrice,
status (enum), expiresAt, durationMinutes (default 20),
viewedAt?, isRevoked?, editHistory[], statusHistory[],
createdAt, updatedAt
```

### Notification
```
_id, recipientId, proposalId, type, title, message, isRead, readAt?, createdAt
```

### Admin
```
_id, email (unique), passwordHash (bcrypt), name, createdAt
```

---

## 8. V2 Candidates (ordered by value)

1. Firebase Cloud Messaging — push notifications
2. Expo / React Native mobile app
3. Socket.IO — real-time updates
4. Multi-tenant — multiple caterers
5. Image upload (Cloudinary)
6. Configurable expiration duration
7. Manual revocation / extend timer
8. PWA — mobile-like experience
9. Dynamic watermarking server-side
10. OTP (email + WhatsApp)
11. Payment gateway (Wompi)
12. Analytics dashboard

---

## 9. Key Commands

```bash
# Engram
engram save "<title>" [--project aroma-sabor] [--scope workspace]
engram search "<query>" [--project aroma-sabor]
engram tui

# Dev
pnpm dev              # Start API + Web concurrently
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript check all packages
```
