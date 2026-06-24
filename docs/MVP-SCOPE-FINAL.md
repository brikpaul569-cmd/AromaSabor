# MVP Scope Final — AromaSabor

> **Date:** 2026-06-24
> **Target:** 8-10 weeks, single developer
> **Max stories:** 20

---

## Principle

Every story in this MVP must pass this test:

> "Without this feature, can a chef still negotiate a proposal with a client?"

If yes → cut it.

---

## Stories

### Track 1 — Auth + Menus (5 stories, ~2.5 weeks)

| # | Story | Description |
|---|-------|-------------|
| 1 | **Admin login** | Admin registers and logs in with email + password. JWT stored in httpOnly cookie. Protected admin layout. |
| 2 | **Create menu** | Admin creates a menu with a name. Menu is saved with a unique slug. |
| 3 | **Manage categories** | Admin adds categories to a menu (e.g., Proteína, Carbohidrato). Each category has a label and max items limit. |
| 4 | **Manage items** | Admin adds items to a category. Each item has: name, image URL (paste URL, no upload), portion grams, price per portion. Items can be removed (hide, not delete). |
| 5 | **Publish menu** | Admin activates a menu. It becomes accessible via public URL. Menu must have at least one category with one item to publish. |

**Cut:** Image upload to Cloudinary (paste URL instead), soft-delete (just hide), slug collision handling (just append random suffix), menu list ordering, edit menu name.

---

### Track 2 — Plate Builder (6 stories, ~3 weeks)

| # | Story | Description |
|---|-------|-------------|
| 6 | **View menu** | Client opens a public menu URL. They see categories and items with names, weights, and prices. |
| 7 | **Select items** | Client taps a category, sees available items, and selects one. Selected item appears in a visual plate area. |
| 8 | **Visual plate** | As items are selected, they appear stacked in a centered plate view. Each item shows its name and portion weight. Basic CSS fade-in animation. |
| 9 | **Replace and remove** | Client taps an item in the plate view to remove it or replace it with another from the same category. |
| 10 | **Quantity adjustment** | Client adjusts number of people (not portions per item). This updates the total price in real time. |
| 11 | **Live pricing** | Price per plate and total price update instantly as items change. Shows a simple breakdown per category. |

**Cut:** Reanimated 3 animations (CSS transitions instead), per-item quantity, category validation beyond maxItems, price breakdown per item (just category total), image loading states.

---

### Track 3 — Proposals + Expiration (5 stories, ~2.5 weeks)

| # | Story | Description |
|---|-------|-------------|
| 12 | **Create proposal** | Chef creates a proposal from a menu. Sets: client name, event name, number of people. Pre-selects items as starting point. Proposal is in DRAFT state. |
| 13 | **Send proposal** | Chef sends the proposal. System generates a unique token (UUID). Proposal status becomes SENT. A 20-minute timer starts. |
| 14 | **Client access** | Client opens `/prop/:token`. If valid and not expired, they see the proposal with the Plate Builder. First visit changes status to ACTIVE. |
| 15 | **Expiration** | A background job checks every 30 seconds for expired proposals. When expired, status changes to EXPIRED. The proposal page shows "This proposal has expired. Request a new version." No content is visible. |
| 16 | **QR code** | Chef can download a QR code for any SENT or ACTIVE proposal from the dashboard. QR encodes the full proposal URL. |

**Cut:** Configurable duration (hardcode 20 min), manual revoke, extend timer, event date field, client email/phone fields, QR inline in page (download only).

---

### Track 4 — Negotiation + Notifications (4 stories, ~2 weeks)

| # | Story | Description |
|---|-------|-------------|
| 17 | **Client modifies** | Client edits items in an active proposal, adds a short reason, and saves. Status changes to MODIFIED_BY_CLIENT. Chef is notified in-app. |
| 18 | **Chef modifies** | Chef edits items in a proposal from the dashboard, adds a reason, and saves. Status changes to MODIFIED_BY_CHEF. If client is viewing, they see a banner on next refresh. |
| 19 | **Approve / Reject** | Either party can approve or reject the proposal from their view. Approve → APPROVED (terminal). Reject → REJECTED with reason (terminal). Both parties see the final status. |
| 20 | **In-app notifications** | Chef has a notification panel. Notifications are created on: proposal sent, client modified, chef modified, proposal approved, proposal rejected, proposal expired. Each shows title, message, timestamp, and proposal link. Unread count badge. |

**Cut:** Edit history with diff view (just store the raw history), status history timeline, notification read/unread toggle (mark read on click), push notifications, email notifications, Socket.IO real-time updates (poll manually or refresh).

---

## What We Are NOT Building (MVP)

| Feature | Reason |
|---------|--------|
| Image upload to Cloudinary | Paste URL is sufficient. Saves Cloudinary setup. |
| Mobile app (Expo/RN) | Web-only MVP. Mobile later. |
| FCM / Push notifications | In-app DB notifications validate the model. |
| Socket.IO | Manual refresh works for one developer. |
| OTP / WhatsApp | Unnecessary for MVP scale. |
| Multi-tenant | Single caterer only. |
| Advanced watermarks | Token + expiration is enough protection. |
| Configurable duration | Hardcode 20 minutes. |
| Per-item quantity | Number of people is the only quantity. |
| Menu editing | Chef can delete and recreate. Saves PATCH endpoint. |
| Slug collision | Random suffix always added. |
| Edit history diff UI | Store history array, display as simple list. |
| Dashboard metrics | Just a list of proposals with filters. |
| Tests beyond pricing | Manual testing for MVP. |

---

## Sprint Allocation

```
Sprint 1 (2 weeks) → Stories 1-5   (Auth + Menus)
Sprint 2 (2 weeks) → Stories 6-8   (Plate Builder pt 1: view + select + visual)
Sprint 3 (2 weeks) → Stories 9-11  (Plate Builder pt 2: replace, qty, pricing)
Sprint 4 (1 week)  → Stories 12-13 (Proposal creation + send)
Sprint 5 (1 week)  → Stories 14-16 (Client access + expiration + QR)
Sprint 6 (1 week)  → Stories 17-18 (Bidirectional editing)
Sprint 7 (1 week)  → Stories 19-20 (Approve/reject + notifications)
                      ─────────
                       10 weeks
```
