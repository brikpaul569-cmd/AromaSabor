# Visual Plate Composer (VPC)

> Status: Approved
> Version: 1.0
> Priority: High
> Phase: Product Experience (Post-MVP)
> Last Updated: 2026-07-02

---

# Purpose

The Visual Plate Composer (VPC) is the flagship user experience of AromaSabor.

Its purpose is to allow chefs and clients to collaboratively compose a gastronomic proposal while receiving immediate visual feedback.

This module is not a form.

It is not a menu.

It is an interactive visual composition experience.

---

# Design Philosophy

The plate is always the center of attention.

Everything else exists only to help the user compose the plate.

The interface should feel calm, elegant and premium.

Every interaction should reinforce the sensation that the user is building a real dish.

---

# Core Principles

## 1. Plate First

The plate is always visible.

Desktop:
Approximately 55–65% of the available visual space.

Mobile:
Approximately 75–85%.

The plate should never compete with forms or large panels.

---

## 2. Real-Time Composition

Every selection updates the plate immediately.

No confirmation buttons.

No "Apply".

No "Save Changes".

The composition is always live.

---

## 3. Free Navigation

Users are never forced through a wizard.

No:

- Step 1
- Step 2
- Next
- Previous

Categories behave as free navigation.

Users may change any ingredient at any time.

---

## 4. Progressive Composition

Every ingredient appears naturally.

Each selection improves the composition.

Removing an ingredient only removes that specific layer.

The complete plate is never rebuilt.

---

# Layout

Recommended structure

------------------------------------------------

≈ Estimated Price

                ◯
          White Plate

 Ingredient Categories

 Ingredient Carousel

 Guests

 Notes

 Send Proposal

------------------------------------------------

The plate remains the visual focus during the entire interaction.

---

# Asset Strategy

Each ingredient owns an independent PNG.

There are no pre-rendered plates.

Example

Chicken.png

Rice.png

Salad.png

Potatoes.png

Sauce.png

Dessert.png

Every possible dish is generated dynamically.

---

# Asset Specification

Every ingredient image MUST follow the same specification.

Canvas:

1200 × 1200 px

Background:

Transparent

Object:

Centered

Plate:

Not included

Shadow:

Not included

Decorations:

Not included

All ingredient PNGs must share the exact same canvas dimensions.

This guarantees perfect visual alignment when stacked.

---

# Rendering Model

Each selected ingredient becomes one visual layer.

Rendering order

Sauce

Protein

Side Dish

Salad

Plate

Each layer uses

- absolute positioning
- inset-0
- object-contain
- Framer Motion

The existing rendering engine remains unchanged.

---

# Animations

Ingredient Added

- Fade In
- Scale 0.9 → 1
- Spring Animation
- Soft Shadow

Ingredient Removed

- Fade Out
- Scale Down

Category Change

- Smooth transition
- Plate remains untouched

Animations should communicate responsiveness, never distraction.

---

# Pricing

Pricing always remains visible.

However, pricing is not the primary visual element.

Recommended display

≈ $48.500

Small typography.

Minimal emphasis.

Reference only.

---

# Performance Goals

Plate update

<100ms

Animations

200–350ms

Image loading

Preloaded when possible

No flickering

Only the modified layer should re-render.

---

# Chef vs Client Experience

Both users interact with the same plate.

Information differs.

Client

- Visual plate
- Ingredients
- Estimated price

Chef

- Visual plate
- Ingredient costs
- Margin
- Preparation time
- Availability
- Future inventory information

The visual experience remains identical.

Business information changes according to role.

---

# Current Technical Scope

The current implementation already provides

- Layer stacking
- Absolute positioning
- Framer Motion transitions
- Dynamic updates
- SVG plate
- Real-time rendering

The objective of this phase is to evolve the experience, not rewrite the rendering engine.

---

# Phase 1 (Implementation)

Scope approved

✅ Rename Plate Builder → Visual Plate Composer

✅ Add imageUrl to MenuItem

✅ Define PNG specification

✅ Render PNG assets

✅ Improve page layout

No architectural changes.

No rendering engine rewrite.

---

# Out of Scope

The following ideas are intentionally postponed.

- Asset Service
- BlurHash placeholders
- Smart ingredient positioning
- Automatic composition engine
- Semantic rendering zones
- AI-assisted plating
- 3D rendering
- Image upload / asset management pipeline

These features belong to future product versions.

The MVP should remain simple, maintainable and stable.

---

# Success Criteria

The Visual Plate Composer is considered successful when:

- Users understand how to build a plate without instructions.
- Every interaction feels immediate.
- The plate remains the visual focus.
- The interface communicates professionalism and quality.
- PNG assets combine naturally.
- The experience encourages confidence during proposal creation.

The objective is not only to display ingredients.

The objective is to make users feel they are composing a real gastronomic proposal.

---

# Engineering Notes

This document intentionally freezes the vision for Version 1.

Future improvements must be driven by real user feedback instead of speculation.

The priority is to deliver a polished experience using the existing architecture before introducing additional technical complexity.

The Visual Plate Composer should evolve through iterative improvements, not complete rewrites.
