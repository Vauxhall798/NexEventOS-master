# Deployment Guide — v0.9 Pilot Release

Target: Vercel (Next.js 14 App Router) + Supabase Postgres. This app has no other required infrastructure.

## 1. Prerequisites

- A Supabase project (the one already used for the SQLite→Postgres migration, or a fresh one for this pilot — confirm which with whoever owns the Supabase account before deploying).
- Node.js **20.x** locally if you're building/testing outside Vercel (`.nvmrc` and `package.json#engines` pin this — Next 14.2 predates Node 24, which we saw cause dev-server crashes).
- Access to set environment variables on the hosting platform (Vercel project settings, or your platform's equivalent).

## 2. Environment variables

| Variable | Purpose | Get it from |
|---|---|---|
| `DATABASE_URL` | Runtime queries — pooled connection (pgbouncer, port **6543**). Must include `?pgbouncer=true` so Prisma disables prepared statements pgbouncer's transaction mode can't support. | Supabase Dashboard → Project Settings → Database → "Transaction" pooler connection string |
| `DIRECT_URL` | Migrations only (`prisma migrate deploy`) — direct connection (port **5432**), since migrations need prepared statements the pooler can't provide. | Supabase Dashboard → Project Settings → Database → direct connection string |
| `NEXTAUTH_SECRET` | Signs session JWTs. Required in production. | Generate once with `openssl rand -base64 32`; reuse the same value across deploys (rotating it invalidates every active session) |
| `NEXTAUTH_URL` | The deployed URL (e.g. `https://nexeventos.vercel.app`). Not needed in dev — NextAuth infers it from the request. | Your Vercel deployment URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Base URL for Storage (logo/signature uploads). | Supabase Dashboard → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Lets the server write to Storage on behalf of any signed-in user. **Server-side secret — never expose to the browser** despite living next to a `NEXT_PUBLIC_*` var. | Supabase Dashboard → Project Settings → API → `service_role` secret |

See `.env.example` for the exact format. **Never commit `.env`** — it's already git-ignored.

On Vercel: Project → Settings → Environment Variables → add all six for the Production (and Preview, if used) environment, then redeploy.

**Important:** `DATABASE_URL` in the current dev `.env` points at the *direct* connection (port 5432), not the pooled one — fine for local development, but on Vercel every serverless invocation opens its own connection, and Postgres/Supabase's connection limit will be exhausted quickly without pgbouncer pooling. Use the pooled (port 6543, `?pgbouncer=true`) URL for `DATABASE_URL` specifically in the Vercel environment variables, even though local `.env` doesn't use it today.

## 3. Database setup (first deploy only)

From a machine with both env vars set (local machine or a one-off script — Vercel's build step does not run migrations automatically):

```bash
npx prisma migrate deploy   # applies all migrations in prisma/migrations, in order
npm run db:seed             # categories, materials, admin/sales users, demo client+proposal, company settings placeholder
```

`migrate deploy` (not `migrate dev`) is the production-safe command — it applies existing migrations without generating new ones or prompting.

If deploying against a database that already has this app's schema and data (e.g. continuing on the same Supabase project used during development), you only need `migrate deploy` to pick up anything new since the last deploy — re-running `db:seed` is safe (every seed operation is an `upsert`, so it won't duplicate or clobber existing real data), but not required.

**Set real passwords immediately after seeding.** `db:seed` gives the seeded admin/sales accounts a placeholder password (`ChangeMe123!`) purely so day-one login is possible — there's no "forgot password"/email flow yet. Change it right away (and create real accounts for anyone else who needs access):

```bash
npx tsx scripts/set-password.ts admin@example.com "<a real password>"
npx tsx scripts/set-password.ts sales@example.com "<a real password>"
```

To add a new user: create the `User` row first (Prisma Studio, `npx prisma studio`, or a one-off script) with the right `role` (`ADMIN`/`SALES`/`MANAGER`/`VIEWER`), then run `set-password.ts` for their email.

## 3.5 Storage bucket setup (first deploy only)

Logo/signature uploads go to Supabase Storage, not local disk (required for Vercel — see §7).

1. Supabase Dashboard → **Storage** → **New bucket** → name it exactly `uploads` → toggle **Public bucket** on (the app relies on public read URLs; write access is still server-only via the service role key, so this doesn't expose anything sensitive).
2. That's it — no policies to configure beyond the public toggle, since all writes go through the server's service role key, never directly from the browser.

## 4. Build & deploy

Standard Vercel flow — no custom build command needed:

- **Build command:** `npm run build` (runs `next build`; `postinstall` already runs `prisma generate` automatically via `npm install`)
- **Output:** Next.js App Router, auto-detected by Vercel
- **Install command:** default (`npm install`)

If deploying elsewhere (not Vercel): `npm run build` then `npm run start`, with `PORT` set as your platform requires.

## 5. Post-deploy verification

1. Load the deployed URL — should redirect to `/login`, not render the app directly (confirms auth middleware is active).
2. Sign in with the real admin account (not the seed placeholder password, per §3) — Dashboard should render with real stats.
3. `Settings > Company Profile` — confirm it shows Sri Eswari Groups' actual details (not the seed placeholder) if this is going live for real use. If it still shows placeholder/blank values, fill them in now — they print on every proposal PDF. Confirm this page is reachable at all only for the admin account (it's hidden from the nav and blocked at the API for other roles).
4. Upload a logo or signature in Company Profile — confirm it shows up immediately and the returned URL is a `supabase.co/storage/...` link, not a broken `/uploads/...` path.
5. Create a test proposal end-to-end: New Proposal → add a material → Save & Preview → Download PDF. Confirm the PDF has correct company branding, GST, and totals.
6. Sign in as the sales account, confirm it can create/edit proposals but Settings doesn't appear in the sidebar and `PUT /api/settings/company` returns 403 if attempted directly.
7. Check Vercel's function logs for the first few real requests — API errors now log server-side (`console.error`) with the original error before returning a friendly message to the client, so this is where to look if something acts up.

## 6. Ongoing deploys

Every subsequent push to the deployed branch triggers a normal Vercel rebuild. Only re-run `prisma migrate deploy` when a new migration has been added to `prisma/migrations/` (check `git log -- prisma/migrations` if unsure) — Vercel's build does not run it for you.

## 7. Vercel-specific notes

- **Prisma + serverless:** `src/lib/db.ts` already uses the singleton-on-`globalThis` pattern to avoid exhausting Postgres connections across serverless function invocations in dev; combined with the pgbouncer pooled `DATABASE_URL`, this is the standard safe setup for Vercel + Supabase.
- **File uploads:** ~~previously wrote to `public/uploads/` on local disk, which doesn't persist on Vercel~~ — resolved. `src/app/api/upload/route.ts` now uploads to Supabase Storage (`src/lib/supabaseStorage.ts`) and returns a public Storage URL. Requires the bucket setup in §3.5 and the `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` env vars in §2.
- **Auth cookies:** NextAuth's session cookie is `Secure` in production by default, which requires HTTPS — Vercel deployments get this automatically, no action needed.
