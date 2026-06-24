# MVP Decision Record — AromaSabor

> **Date:** 2026-06-24
> **Status:** Approved
> **Author:** Tech Lead / Product Owner

---

## Context

AromaSabor started as a multi-platform project (Web + React Native Mobile + API) with a full notification stack (FCM, Socket.IO, Resend) and advanced content protection (OTP, WhatsApp, dynamic watermarking).

After reviewing the business goals, scope, and development capacity (single senior/mid developer), the following simplifications are adopted to reach a working MVP in ~11 weeks.

---

## Decisions

### 1. Platform

| Option | Decision |
|--------|----------|
| Web + API | ✅ **MVP** |
| Mobile (Expo/React Native) | ❌ V2 |
| PWA | ❌ V2 |

**Rationale:** Building and maintaining a mobile app doubles development effort. A responsive Next.js web app serves both admin and client for the MVP. Mobile becomes relevant once the web product validates the business model.

---

### 2. Plate Builder Visual

| Option | Decision |
|--------|----------|
| Visual plate builder with animations | ✅ **MVP — mandatory** |
| Simple form-based selection | ❌ Rejected |

**Rationale:** The visual plate builder is the core differentiator. Without it, the product has no competitive advantage. MVP includes CSS/Framer Motion animations (not Reanimated 3, which is React Native only).

---

### 3. Collaborative Negotiation

| Feature | Decision |
|---------|----------|
| Client edits proposal | ✅ **MVP** |
| Chef edits proposal | ✅ **MVP** |
| Approval / rejection cycle | ✅ **MVP** |
| Edit history | ✅ **MVP** |

**Rationale:** The entire negotiation loop must be present in the MVP. This is the product's core value proposition.

---

### 4. Proposal Expiration

| Feature | Decision |
|---------|----------|
| Time-limited proposals | ✅ **MVP** |
| Configurable duration (default 20 min) | ✅ **MVP** |
| Manual revocation by chef | ✅ **MVP** |
| Expired proposal screen | ✅ **MVP** |

**Rationale:** Protects the chef's commercial proposal. Time pressure encourages client action. The menu itself is permanent — only the proposal expires.

---

### 5. Notifications

| Option | Decision |
|--------|----------|
| In-app database notifications | ✅ **MVP** |
| Firebase Cloud Messaging | ❌ V2 |
| WhatsApp Business | ❌ V2 |
| Resend email | ❌ V2 |

**Rationale:** In-app notifications are sufficient to validate the communication model. Push and email become relevant when the product needs to re-engage users outside the platform.

---

### 6. Real-Time Updates

| Option | Decision |
|--------|----------|
| Periodic polling (15s) | ✅ **MVP** |
| Socket.IO | ❌ V2 |

**Rationale:** Polling is simpler to implement and debug. Socket.IO adds operational complexity (Redis adapter for scaling). Upgrade when concurrent users justify it.

---

### 7. Content Protection

| Feature | Decision |
|---------|----------|
| Token-based proposal access | ✅ **MVP** |
| Proposal expiration | ✅ **MVP** |
| Static text overlay on images | ✅ **MVP (basic CSS overlay)** |
| OTP via email | ❌ V2 |
| OTP via WhatsApp | ❌ V2 |
| Dynamic server-side watermarking | ❌ V2 |

**Rationale:** Token + expiration covers the primary threat (unauthorized access after expiry). OTP and advanced watermarking add complexity without proven need.

---

### 8. Authentication

| Feature | Decision |
|---------|----------|
| JWT for admin (email + password) | ✅ **MVP** |
| Token-based access for clients | ✅ **MVP** |
| Multi-tenant (multiple caterers) | ❌ V2 |
| Social login | ❌ V2 |

**Rationale:** Single-tenant MVP. One admin manages their menus and proposals. Multi-tenant requires a full org/workspace model.

---

### 9. Infrastructure

| Component | Decision |
|-----------|----------|
| Monorepo (Turborepo) | ✅ **MVP** |
| Next.js 14 (App Router) | ✅ **MVP** |
| NestJS | ✅ **MVP** |
| MongoDB Atlas | ✅ **MVP** |
| Cloudinary | ✅ **MVP** |
| QR code generation (`qrcode`) | ✅ **MVP** |
| CSS + Framer Motion animations | ✅ **MVP** |
| Zustand + React Query | ✅ **MVP** |
| Docker (local dev) | ✅ **MVP** |
| Railway (API) + Vercel (Web) | ✅ **MVP** |

---

## V2 Candidates (Post-MVP)

Ordered by expected business value:

1. **Firebase Cloud Messaging** — push notifications for engagement
2. **Expo / React Native mobile app** — reach clients without browsers
3. **Socket.IO** — real-time updates at scale
4. **Multi-tenant** — onboarding multiple caterers
5. **PWA** — mobile-like experience without app install
6. **Dynamic server-side watermarking** — advanced content protection
7. **OTP (email + WhatsApp)** — enhanced access security
8. **Payment gateway (Wompi)** — move from quoting to transacting
9. **Analytics dashboard** — insights for caterers
10. **WhatsApp Business API** — notification channel
