# Daddy's Weekend Special

A restaurant menu ordering app built with Next.js 15 — dark navy/gold UI, guest checkout, Stripe payments, and an admin panel.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values (see Environment Variables below)
cp .env.example .env.local

# 3. Create the database and apply schema
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

> ⚠️ Change this password immediately after first login — do not use in production as-is.

| Field    | Value                              |
|----------|------------------------------------|
| Email    | `admin@daddysweekendspecial.com`   |
| Password | `ChangeMe_Immediately123!`         |

---

## Database

This project uses **SQLite** (via Prisma) for local development — no database server required.

| Command             | What it does                              |
|---------------------|-------------------------------------------|
| `npm run db:push`   | Apply schema to SQLite (creates `dev.db`) |
| `npm run db:seed`   | Seed 10 menu items + admin user           |
| `npm run db:studio` | Open Prisma Studio (visual DB browser)    |

The database file lives at `prisma/dev.db` and is gitignored.

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in:

| Variable                              | Required | Description                                              |
|---------------------------------------|----------|----------------------------------------------------------|
| `DATABASE_URL`                        | Yes      | `file:./dev.db` for local SQLite                         |
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

Copy the `whsec_...` value printed and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

For production, add a webhook in your [Stripe Dashboard](https://dashboard.stripe.com/webhooks) pointing to `https://yourdomain.com/api/stripe/webhook` with events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the Dashboard
3. Set them in `.env.local`

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
  schema.prisma     # SQLite schema
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
- **Rate limiting** — 10 req/min per IP on public mutating endpoints
- **Role-based admin** — `/admin/*` routes protected server-side via NextAuth JWT
- **HTML order emails** — branded dark navy/gold templates
- **Soft delete** — menu items with order history are hidden, not deleted

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Shadcn-style components
- Prisma ORM + SQLite (local) / PostgreSQL (production-ready)
- NextAuth (Credentials + JWT)
- Stripe (PaymentIntents + Webhooks)
- Nodemailer
- Cloudinary
- Upstash Redis (optional, with in-memory fallback)
- Zod + React Hook Form
