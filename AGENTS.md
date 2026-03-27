# AGENTS.md

## Project overview

This project is an MVP web app for an AI-assisted stylist product.

Core user flow:
1. User uploads a front photo
2. User optionally uploads a back photo
3. User selects lightweight style preferences
4. App generates structured clothing recommendations
5. App fetches matching real products from one commerce source
6. User selects a product
7. App generates a virtual try-on preview
8. User can open the product page

This is an MVP. Keep the implementation lean, demoable, and production-minded.

---

## Product priorities

Always optimize for:
1. a clean end-to-end user flow
2. a polished neutral premium UI
3. simple maintainable code
4. safe backend handling of secrets and external APIs
5. incremental progress over theoretical architecture

---

## Non-goals for now

Do NOT add unless explicitly requested:
- authentication
- user accounts
- social features
- internal checkout
- wardrobe management
- multi-retailer aggregation
- analytics dashboards
- admin panels
- advanced background jobs
- speculative future architecture

---

## Stack constraints

Preferred stack:
- Next.js
- TypeScript
- Tailwind CSS
- App Router
- Vercel deployment
- API routes and/or server actions for backend logic

Use the existing project structure where possible.
Do not rewrite the entire app unless explicitly requested.

---

## Architecture rules

- Prefer small, composable components
- Avoid giant files
- Avoid unnecessary abstractions
- Avoid creating service/provider/manager layers unless clearly justified
- Keep business logic out of presentational UI components
- Keep secrets server-side only
- Normalize external API responses before using them in UI
- Add types for all important data shapes

When integrating external services:
- build a thin adapter
- isolate provider-specific logic
- make future replacement possible without overengineering

---

## MVP implementation order

Build in this order unless explicitly told otherwise:

1. UI shell
2. upload flow
3. preferences flow
4. mocked recommendations
5. recommendation UI
6. mocked products
7. real commerce integration
8. mocked try-on flow if needed
9. real try-on integration
10. polish loading, error, and empty states

Important:
Prefer mocks first for external integrations.
Do not block progress on live API integration if the flow can be built with mock data.

---

## UI guidance

The UI should feel:
- elegant
- neutral
- premium
- calm
- minimal
- trustworthy

Avoid:
- loud gradients
- cluttered layouts
- gimmicky animations
- playful/gamified styling
- overly gendered design language

Use:
- generous spacing
- clean cards
- subtle shadows
- restrained color palette
- strong typography hierarchy
- mobile-first responsive layout

---

## Photo handling rules

- Front photo is required
- Back photo is optional
- Validate file type, file size, and basic dimensions
- Provide user-friendly upload guidance
- Never claim exact body measurements unless truly implemented
- Never claim exact fit accuracy
- Treat generated try-on output as a visual preview, not a guarantee

---

## Commerce integration rules

For MVP, use only one commerce source.
Do not add multi-store aggregation.

Commerce integration should:
- accept structured recommendation search terms
- normalize product results into a stable internal shape
- filter out unusable or unavailable products where possible
- return a small curated set, not huge result lists

The UI should feel like a stylist recommendation flow, not a generic marketplace search.

---

## Virtual try-on rules

- Keep provider logic isolated
- Use backend-only credentials
- Do not expose provider secrets to the client
- Handle failures gracefully
- Show clear loading states
- Store generated result references in a simple, maintainable way
- Do not overbuild job orchestration for MVP

---

## Vercel / deployment rules

- Keep the app compatible with Vercel deployment
- Do not rely on persistent local filesystem storage
- Use environment variables for secrets
- Be mindful of serverless runtime constraints
- Prefer simple request/response patterns over heavy background systems

---

## Code change rules for agents

Before major changes:
- inspect existing code
- reuse what already works
- avoid broad rewrites

When making changes:
- keep them incremental
- explain important reasoning briefly
- prefer working code over speculative architecture
- avoid introducing dependencies without clear need

If something is unclear:
- choose the simplest solution that supports the MVP

---

## Testing expectations

- Use Playwright for critical end-to-end coverage
- Treat these as critical flows:
  - upload -> preferences -> recommendations
  - recommendations -> product selection -> try-on
  - route guards that protect required session state
  - loading, error, and retry states in key user-facing steps
- When changing critical flow behavior, add or update Playwright coverage in the same change when practical
- Prefer deterministic test setup with mocks over live third-party dependencies

---

## Definition of done

A feature is only done when:
- it works in the intended user flow
- it has reasonable loading/error/empty states
- it is typed properly
- it fits the UI style of the app
- it does not leak secrets
- it does not add unnecessary architecture
- critical flows still have appropriate Playwright coverage
