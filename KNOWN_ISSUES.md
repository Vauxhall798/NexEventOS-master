# Known Issues — v0.9 Pilot Release

Issues below are known, deliberate, and were not fixed in this pass either because they're out of scope (architecture/feature changes, which this pass explicitly excluded) or because they're low-risk at pilot scale. Each entry says what the risk is and what to do about it.

## Resolved since the initial pilot pass

### ~~No authentication/authorization~~ — Fixed
NextAuth (email/password, JWT sessions) now gates every route via `src/middleware.ts`; role-based checks (`requireRole`) restrict writes to non-VIEWER roles and Company Settings to ADMIN only. See `CHANGELOG.md` for detail. What remains open (see Medium section below): no self-service password reset, no user-management UI.

### ~~File uploads don't persist on Vercel~~ — Fixed
Logo/signature uploads now go to Supabase Storage (`src/lib/supabaseStorage.ts`) instead of local disk. Requires the `uploads` bucket and `SUPABASE_SERVICE_ROLE_KEY` set up per `DEPLOYMENT_GUIDE.md` §2/§3.5.

## Medium — monitor, fix if it becomes a real problem

### No self-service password reset or user-management UI
There's no "forgot password" flow (would need an email-sending service, deliberately not added to keep this pass self-contained) and no in-app screen to create/deactivate users or change roles. Both are done via `scripts/set-password.ts` and direct database access (Prisma Studio or a script) — workable for a small pilot team, not scalable to self-serve onboarding. Revisit if the user base grows past what one admin can manage by hand.

### Seeded accounts share one placeholder password until changed
`db:seed` sets `ChangeMe123!` on the admin/sales accounts purely so day-one login is possible. If this isn't changed immediately post-deploy (see `DEPLOYMENT_GUIDE.md` §3), both accounts remain guessable. Not a code defect — an operational step that must actually be done.

### `findOrCreateClient` has a rare duplicate-client race
Two proposals submitted at the exact same instant for a brand-new client (same email, or same name with no email) can each miss the other's not-yet-committed row and both insert a Client. `Client.email` has no database-level unique constraint. At pilot scale (one or a few sales users, proposals created seconds apart at most) this is very unlikely to occur. Fixing it properly means adding a unique constraint on `Client.email`, which requires first checking production data for existing duplicate emails and deciding how to merge them — a data-migration decision, not a pure code fix, so it was deliberately not done silently in this pass.

### List endpoints have no real pagination
`/api/proposals`, `/api/clients`, `/api/materials` all return every matching row (with a defensive 500/1000-row cap added this pass so a runaway dataset can't return unbounded results). Building real pagination is a UI change (page controls, infinite scroll, etc.) and was treated as out of scope for a hardening-only pass. Fine for a pilot's data volume; revisit if any list grows past a few hundred rows.

### Search doesn't scale on database indexes
Case-insensitive substring search (`contains`, now with `mode: "insensitive"`) can't use a plain B-tree index efficiently in Postgres. Fine at pilot volume; if the catalogue/proposal history grows large and search feels slow, the fix is `pg_trgm` GIN indexes or Postgres full-text search — not a code change to this app's logic, just an index/migration addition.

### Bulk material spreadsheet import is still row-by-row
The N+1 category/lookup queries were batched this pass, but each row's `create`/`update` is still a separate sequential query. Fine for catalogues in the tens-to-low-hundreds of rows; a multi-thousand-row import would be slow (not broken, just slow) and isn't wrapped in one all-or-nothing transaction — a failure partway through leaves prior rows committed.

## Low — cosmetic / long-tail

### PDF pagination on very long free-text fields
The PDF export protects each line-item row and each labeled section (Notes, Terms, etc.) from being split across a page break — but if a single Notes or Terms & Conditions entry is long enough to exceed one full page by itself, that one block isn't further split, so it can still overflow a page boundary. Realistic proposal text (a few sentences to a short paragraph) is unaffected; this only bites on unusually long free text in a single field.

### Category names can duplicate by case
"LED Screen" and "led screen" become two separate categories (case-sensitive match in the upsert). Low impact — worst case is a slightly messier category list, not data loss.

### Dependency versions
Prisma is on 5.22; 7.8 is available. `npm audit` also flags transitive vulnerabilities in `dompurify` (via `jspdf`), `next` itself, `postcss` (via `next`), and `uuid` (via `next-auth`'s dependency tree) — every fix `npm audit fix --force` offers is a major-version bump (`next@16`, `jspdf@4`, etc.). Deliberately not upgraded in this pass — a major-version upgrade is a breaking-change-risk item on its own and should be scheduled and tested separately, not bundled into a stability/feature pass.

### Local `.env` uses the direct (non-pooled) Postgres connection for `DATABASE_URL`
Works fine for local development and this pass's testing, but on Vercel every serverless invocation opens its own connection — without pgbouncer pooling, concurrent traffic can exhaust Supabase's connection limit. Use the pooled connection string (port 6543, `?pgbouncer=true`) for `DATABASE_URL` specifically in the Vercel environment variables; see `DEPLOYMENT_GUIDE.md` §2.
