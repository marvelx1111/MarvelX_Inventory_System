# Marvel X — Dealership ERP

A complete ERP dashboard for a car dealership with an integrated PPF (paint protection film) installation business.

## Tech Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Framer Motion
- Recharts
- React Router v7
- In-memory typed data store (API-ready)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Authentication (Supabase Auth)

Production login uses **Supabase Auth** (email + password). Passwords are hashed server-side by Supabase — they are never stored in `app_users`.

### One-time setup

1. Add to `.env.local` (never commit these):

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AUTH_PASSWORD_ADMIN=choose-a-strong-password-min-12-chars
AUTH_PASSWORD_SALES=choose-a-strong-password-min-12-chars
AUTH_PASSWORD_PPF=choose-a-strong-password-min-12-chars
```

2. Bootstrap auth accounts (links `app_users` → `auth.users`):

```bash
npm run db:auth-bootstrap
```

3. Sign in at `/login` with email (e.g. `admin@marvelx.pk`) and the password you set above.

### Local demo mode (development only)

To use offline mock login without Supabase Auth, set in `.env.local`:

```bash
VITE_ALLOW_DEMO_AUTH=true
```

This is disabled in production builds when Supabase is configured.

## Demo Accounts (local demo mode only)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Full access |
| `sales` | `sales123` | Sales & inventory |
| `ppf_manager` | `ppf123` | PPF studio only |

**Do not use these in production.** Use `db:auth-bootstrap` with strong passwords instead.

## Features

- **Dashboard** — KPI cards, sales/profit charts, audit activity feed
- **Vehicle Inventory** — Search, filter, detail with documents checklist
- **Purchases** — Record acquisitions, auto-create inventory
- **Sales** — Multi-step sale flow with installments & delivery
- **Customers** — Directory with purchase/sale history
- **Expenses** — Vehicle & showroom expenses with summaries
- **Investors** — Investments and monthly returns
- **PPF Studio** — Job kanban, roll inventory, warranties
- **Admin** — Users/roles and audit log viewer
- **Global search** — `Ctrl+K` / `⌘K` command palette
- **Dark mode** — Toggle in sidebar

## Supabase

The app connects to Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local`. On startup it hydrates the in-memory store from the database; if Supabase is empty or unreachable, it falls back to local seed data.

```bash
# Copy and fill credentials
cp .env.example .env.local

# Seed database from mock data
npm run db:seed

# Run cross-check loops (row counts + FK integrity)
npm run db:crosscheck
```

**Also add env vars to Vercel** for production deployment.

Schema migrations live in `supabase/migrations/`.

