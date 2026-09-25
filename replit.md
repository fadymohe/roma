# ROMA Beauty Store

ROMA is an Arabic RTL luxury beauty storefront for discovering makeup and skincare, selecting shades, managing a cart, and starting checkout.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/roma-store` — React/Vite storefront with Arabic RTL pages for home, shop, product details, and cart.
- `artifacts/api-server/src/routes/storefront.ts` — storefront, shipping-rate, and order endpoints.
- `lib/api-spec/openapi.yaml` — source of truth for storefront API contracts.
- `lib/db/src/schema` — Drizzle tables for categories, products, variants, orders, and order items.
- `artifacts/roma-store/src/index.css` — ROMA theme tokens, typography, motion, and responsive styles.

## Architecture decisions

- The storefront is Arabic-first and uses RTL layout throughout; product slugs and API routes remain Latin for stable URLs.
- The first build keeps cart state in local browser storage so guest shopping works without authentication.
- Shipping rates expose an Aramex option in the checkout contract; carrier credentials and live label/tracking calls are not configured yet.

## Product

The current storefront includes a premium ROMA landing page, category browsing, product search and filtering, product detail pages with shade selection, a persistent cart drawer/page, shipping-rate calculation, and guest order submission.

## User preferences

The product direction is Arabic, RTL, luxury, warm rose/nude, and editorial rather than a generic ecommerce template.

## Gotchas

Regenerate the API client after changing `lib/api-spec/openapi.yaml` before importing new hooks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
