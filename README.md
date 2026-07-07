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

## Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Full access |
| `sales` | `sales123` | Sales & inventory |
| `ppf_manager` | `ppf123` | PPF studio only |

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

