# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint via Next.js

npm run db:push      # Apply schema changes without migration files
npm run db:migrate   # Create and apply migrations
npm run db:seed      # Seed admin user + 10 menu items
npm run db:studio    # Open Prisma Studio

# Stripe webhook (required for payment flow locally)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

No test suite is configured.

## Architecture

Next.js 15 App Router restaurant ordering app with two distinct user surfaces:

**Customer flow** (`app/(customer)/`): Browse menu → add to cart (localStorage via `useCart` hook) → checkout form → Stripe PaymentIntent created server-side → webhook confirms payment.

**Admin flow** (`app/admin/`): JWT-protected via `middleware.ts`. NextAuth Credentials provider with bcrypt. Actions: confirm/cancel orders (cancel triggers automatic Stripe refund + email), manage menu items.

### Key data flow

`POST /api/payment-intent` — validates cart items are still available, **recomputes total from DB prices** (never trusts client), creates Stripe PaymentIntent and an `Order` (status: PENDING). Webhook at `/api/stripe/webhook` is the sole source of truth for payment status — sets `paymentStatus: PAID` or `FAILED`.

### Important constraints enforced server-side

- Max 10 active menu items (enforced at create and re-enable)
- Price always recomputed from DB, never from client cart
- Menu items with order history are soft-deleted (`isAvailable: false`), never hard-deleted
- All user inputs sanitized via `xss` library (`lib/sanitize.ts`)
- Rate limiting on `/api/payment-intent` and `/api/orders`: 10 req/min per IP (Upstash Redis or in-memory fallback)

### Auth pattern

`lib/auth.ts` configures NextAuth with JWT sessions. `middleware.ts` protects `/admin/*` routes by checking `token.role === "ADMIN"`. Admin API routes call `requireAdmin()` helper. Session augmentation in `types/next-auth.d.ts`.

### Database

PostgreSQL via Supabase, Prisma ORM. Key models: `User`, `MenuItem`, `Order`, `OrderItem`. `OrderItem.price` is a snapshot at order time (Decimal, not float). Cascade delete: deleting an Order removes its OrderItems.

### Integrations

- **Stripe**: PaymentIntents (GBP), server-side webhook validation, refunds via `stripe.refunds.create()`
- **Cloudinary**: Server-side image upload only (`lib/cloudinary.ts`), folder `daddys-weekend-special`, max 5MB
- **Nodemailer**: HTML email templates in `emails/templates.ts` — sent on confirm/cancel, non-blocking

## Required environment variables

See `.env.example`. Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Optional (fallback to in-memory/disabled): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

## Seeded credentials

```
Email:    admin@daddysweekendspecial.com
Password: ChangeMe_Immediately123!
```
