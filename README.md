# Daddy's Weekend Special

A restaurant menu ordering app built with Next.js 15 — dark navy/gold UI, guest checkout, Stripe payments, and an admin panel.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values (see Environment Variables below)
cp .env.example .env

# 3. Push schema to your database
npm run db:push

# 4. Seed menu items + admin user
npm run db:seed

# 5. Start dev server
npm run dev
```

App runs at **http://localhost:3000**
Admin panel at **http://localhost:3000/admin**

---

## Default Seeded Credentials

> **Change this password immediately after first login — do not use in production as-is.**

| Field    | Value                              |
|----------|------------------------------------|
| Email    | `admin@daddysweekendspecial.com`   |
| Password | `ChangeMe_Immediately123!`         |

---

## Database

This project uses **PostgreSQL** via [Neon](https://neon.tech) (serverless Postgres). Set `DATABASE_URL` to your Neon connection string in `.env`.

| Command             | What it does                                      |
|---------------------|---------------------------------------------------|
| `npm run db:push`   | Apply schema to PostgreSQL (no migration files)   |
| `npm run db:seed`   | Seed 10 menu items + admin user                   |
| `npm run db:studio` | Open Prisma Studio (visual DB browser)            |

---

## Complete Workflow

### Customer Flow

1. **Browse menu** — `GET /api/menu` returns all available items ordered by `displayOrder`
2. **Add to cart** — client-side cart stored in `localStorage` via `useCart` context
3. **Checkout** — guest form (name, email, phone) + cart submitted to `POST /api/payment-intent`
   - Server validates items are available, recomputes total from DB prices (never trusts client)
   - Creates a Stripe `PaymentIntent` and an `Order` record with status `PENDING / paymentStatus PENDING`
   - Returns `clientSecret` + `orderId` to the client
4. **Payment** — Stripe embedded payment form completes the `PaymentIntent`
5. **Webhook** — Stripe calls `POST /api/stripe/webhook`
   - `payment_intent.succeeded` → sets `paymentStatus = PAID`
   - `payment_intent.payment_failed` → sets `paymentStatus = FAILED`
6. **Order confirmation page** — polls `GET /api/orders?orderId=…` to show order details

### Admin Flow

1. **Login** — `POST /admin/login` via NextAuth credentials (bcrypt password check, JWT session)
2. **Dashboard** — `GET /api/admin/orders` with optional `?status=` and `?search=` filters
3. **Confirm order** — `PATCH /api/admin/orders?id=…` with `{ action: "CONFIRM" }`
   - Sets `status = CONFIRMED`, sends confirmation email to customer
4. **Cancel order** — `PATCH /api/admin/orders?id=…` with `{ action: "CANCEL" }`
   - If `paymentStatus = PAID`, triggers Stripe refund and sets `paymentStatus = REFUNDED`
   - Sets `status = CANCELLED`, sends cancellation email to customer
5. **Manage menu** — `GET/POST/PATCH/DELETE /api/admin/menu` (add, edit, toggle availability)
6. **Upload images** — `POST /api/admin/menu/upload` via Cloudinary (server-side, secret never exposed)

### Route Protection

- `/admin/*` routes are protected by `middleware.ts` — checks NextAuth JWT for `role = ADMIN`
- Admin API routes (`/api/admin/*`) call `requireAdmin()` server-side for every request

---

## Environment Variables

Copy `.env.example` → `.env` and fill in:

| Variable                              | Required | Description                                              |
|---------------------------------------|----------|----------------------------------------------------------|
| `DATABASE_URL`                        | Yes      | Neon PostgreSQL connection string                        |
| `NEXTAUTH_SECRET`                     | Yes      | Random secret — run `openssl rand -base64 32`            |
| `NEXTAUTH_URL`                        | Yes      | `http://localhost:3000` locally                          |
| `STRIPE_SECRET_KEY`                   | Yes      | Stripe secret key (`sk_test_...`)                        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | Yes      | Stripe publishable key (`pk_test_...`)                   |
| `STRIPE_WEBHOOK_SECRET`               | Yes      | Webhook signing secret (`whsec_...`) from Stripe CLI     |
| `CLOUDINARY_CLOUD_NAME`               | Yes      | For menu image uploads                                   |
| `CLOUDINARY_API_KEY`                  | Yes      | Cloudinary API key                                       |
| `CLOUDINARY_API_SECRET`               | Yes      | Cloudinary API secret                                    |
| `UPSTASH_REDIS_REST_URL`              | No       | Rate limiting (falls back to in-memory if not set)       |
| `UPSTASH_REDIS_REST_TOKEN`            | No       | Rate limiting                                            |
| `SMTP_HOST`                           | No       | Email — e.g. `smtp.gmail.com`                            |
| `SMTP_PORT`                           | No       | Usually `587`                                            |
| `SMTP_USER`                           | No       | SMTP username                                            |
| `SMTP_PASSWORD`                       | No       | SMTP password or app password                            |
| `SMTP_FROM`                           | No       | From address for order emails                            |

---

## Stripe Webhook (Local Testing)

```bash
# Install Stripe CLI, then:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` value printed and set it as `STRIPE_WEBHOOK_SECRET` in `.env`.

For production, add a webhook in your [Stripe Dashboard](https://dashboard.stripe.com/webhooks) pointing to `https://yourdomain.com/api/stripe/webhook` with events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the Dashboard
3. Set them in `.env`

Images are uploaded server-side — your API secret is never exposed to the browser.

---

## Project Structure

```
app/
  (customer)/       # Home, cart, checkout, order-success
  admin/            # Login, dashboard, menu management, orders
  api/              # All API routes (menu, orders, payment, webhooks, auth)
components/
  ui/               # Button, Card, Input, Badge, Skeleton, etc.
  admin/            # Sidebar
lib/                # prisma, auth, stripe, cloudinary, email, ratelimit, utils
hooks/              # useCart (context + localStorage)
emails/             # HTML email templates (order confirmation, cancellation)
prisma/
  schema.prisma     # PostgreSQL schema
  seed.ts           # Seeds 10 menu items + admin user
types/              # TypeScript types + NextAuth module augmentation
utils/              # Zod validators
middleware.ts       # Protects /admin/* routes via NextAuth JWT role check
```

---

## Key Features

- **Guest checkout** — no account needed to order
- **10-item menu cap** — enforced at API layer
- **Stripe PaymentIntents** — embedded payment form, not a redirect
- **Webhook as source of truth** — payment status set by Stripe webhook, not client callback
- **Server-side price enforcement** — total always computed from DB, client cart is never trusted
- **Rate limiting** — 10 req/min per IP on public mutating endpoints
- **Role-based admin** — `/admin/*` routes protected server-side via NextAuth JWT
- **HTML order emails** — branded dark navy/gold templates for confirmation and cancellation
- **Auto-refund on cancel** — cancelling a paid order triggers a Stripe refund automatically
- **Soft delete** — menu items with order history are hidden, not deleted

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Shadcn-style components
- Prisma ORM + PostgreSQL (Neon serverless)
- NextAuth (Credentials + JWT)
- Stripe (PaymentIntents + Webhooks)
- Nodemailer
- Cloudinary
- Upstash Redis (optional, with in-memory fallback)
- Zod + React Hook Form
