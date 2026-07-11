# Security

## What is safe in Git

| Item | Safe to commit? | Notes |
|------|-----------------|-------|
| Supabase project URL | Yes | Public identifier |
| Supabase **anon** key | Yes* | Designed for browsers; access must be blocked by RLS |
| Supabase **service_role** key | **Never** | Full database bypass — `.env.local` / Vercel secrets only |
| Portal passwords | **Never** | Set via `AUTH_PASSWORD_*` in `.env.local` only |
| `.env.local` | **Never** | Already in `.gitignore` |

\*The anon key in `src/config/supabase.ts` is intentional for Vercel builds. Security depends on **Row Level Security**, not hiding this key.

## If passwords were ever in GitHub

1. **Rotate immediately** in Supabase Dashboard → Authentication → Users (or run `npm run db:update-passwords` with new values in `.env.local`).
2. Change **all** portal passwords (`AUTH_PASSWORD_ADMIN`, `AUTH_PASSWORD_SALES`, `AUTH_PASSWORD_PPF`).
3. If `SUPABASE_SERVICE_ROLE_KEY` was ever committed, **rotate it** in Supabase → Settings → API → regenerate service_role key, then update Vercel and `.env.local`.
4. Old commits may still contain secrets in Git history. Rotating credentials is mandatory; consider making the repo private.

## Database access (RLS)

Apply migrations in order, especially:

- `003_supabase_auth.sql` — authenticated-only business data
- `008_finance_settings_rls.sql` — finance admin-only
- `009_harden_rls.sql` — removes anonymous access; module-based policies for investors, audit, expenses

Run in **Supabase Dashboard → SQL Editor** if migrations are not auto-applied.

## Before each release

```bash
npm run security:check
npm run build
```

## Vercel production checklist

- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set as env vars
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set as **server-only** secret (not exposed to client)
- [ ] `AUTH_PASSWORD_*` **not** set on Vercel (bootstrap scripts run locally only)
- [ ] `VITE_ALLOW_DEMO_AUTH` is **not** set in production
- [ ] Supabase **Leaked Password Protection** enabled (Auth → Settings)
- [ ] Repository is **private** if it contains business logic you do not want public

## Reporting issues

If you suspect a breach, rotate Supabase keys and all portal passwords first, then review Supabase Auth logs and `audit_logs` in the app.
