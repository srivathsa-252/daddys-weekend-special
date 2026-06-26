# Daddy's Weekend Special

A production-ready menu ordering web application built with Next.js 15, featuring a premium dark navy/gold UI.

> ⚠️ **Default admin password must be changed before production deployment.**
> See [Default Credentials](#default-credentials) below.

---

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + Shadcn-style components
- **Prisma ORM** + PostgreSQL
- **NextAuth** (Credentials, JWT)
- **Stripe** (PaymentIntents + Webhooks)
- **Nodemailer** (HTML email)
- **Cloudinary** (image storage)
- **Upstash Redis** (rate limiting, with in-memory fallback)
- **Zod** + **React Hook Form** validation

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (optional) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (optional) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (usually 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password or app password |
| `SMTP_FROM` | From address (e.g. `"Daddy's Weekend Special <noreply@...>"`) |

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Seed the database

```bash
npm run db:seed
```

This creates **10 sample menu items** and **1 admin user**. See output for the warning.

### 5. Start development server

```bash
npm run dev
```

---

## Default Credentials

> ⚠️ **These credentials are for initial setup only. Change the password immediately after first login.**

| Field | Value |
|---|---|
| Email | `admin@daddysweekendspecial.com` |
| Password | `ChangeMe_Immediately123!` |

To change the password, update the admin user directly in your database or add a password-change route to the admin panel.

---

## Stripe Webhook (Local Testing)

Install the Stripe CLI and run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` value printed to your terminal and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

For production, set the webhook endpoint in your [Stripe Dashboard](https://dashboard.stripe.com/webhooks) pointing to `https://yourdomain.com/api/stripe/webhook` with these events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard** and copy your Cloud Name, API Key, and API Secret
3. Set these in `.env.local`
4. Images are uploaded server-side via `/api/admin/menu/upload` — your API secret is never exposed to the browser

---

## Key Features

- **Guest checkout** — customers never need an account
- **10-item menu cap** — enforced at the API layer with clear UI messaging
- **Soft delete** — menu items with order history are hidden, not removed, preserving order integrity
- **Stripe PaymentIntents** — embedded payment form (not redirect to Stripe Checkout)
- **Webhook as source of truth** — payment status updated independently of the client callback
- **Rate limiting** — 10 req/min per IP on public mutating endpoints (Upstash Redis or in-memory fallback)
- **HTML email templates** — branded dark navy/gold for confirmation and cancellation emails
- **Role middleware** — `/admin/*` routes protected server-side via NextAuth JWT role check

---

## Folder Structure

```
app/
  (customer)/         # Customer-facing pages (home, cart, checkout, order-success)
  admin/              # Admin pages (login, dashboard, menu, orders)
  api/                # API routes
components/
  ui/                 # Base UI components (Button, Card, Input, Badge, etc.)
  admin/              # Admin-specific components (Sidebar)
lib/                  # Prisma, auth, Stripe, Cloudinary, email, rate limit, utils
hooks/                # useCart context
emails/               # HTML email templates
prisma/               # Schema + seed script
types/                # TypeScript types + NextAuth declarations
utils/                # Zod validators
middleware.ts         # Admin route protection
```
