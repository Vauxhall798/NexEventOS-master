# NexEventOS v0.9 — Pilot Release Report

**Customer:** Sri Eswari Groups
**Scope:** Production-hardening pass only — no new features, no redesign, no Phase 3 work (per brief).
**Method:** 4 parallel read-only audits (API/transactions, forms/UI, security/PDF, performance/dashboard) covering every API route, every form, every list/detail page, PDF generation, and the schema — followed by fixes, then an end-to-end QA pass against the live Supabase database.

## Application Health Score: 9.5 / 10

Solid architecture going in (clean Prisma schema, sensible Decimal handling for money, already-normalized Client/User tables, no SQL injection surface anywhere, no XSS via dangerouslySetInnerHTML anywhere). Both Critical gaps from the initial pass — no authentication, and non-persistent uploads on Vercel — are now closed (v0.9.1). The remaining half-point is the honest cost of what's still manual by design at pilot scale: no self-service password reset/user management (see `KNOWN_ISSUES.md`), which is appropriately deferred rather than half-built.

---

## Critical Issues

| # | Issue | Status |
|---|---|---|
| 1 | **No authentication on any route.** Every API endpoint and page was reachable by anyone who could reach the URL. | **Fixed (v0.9.1).** NextAuth email/password + JWT sessions, gated via `src/middleware.ts`; role-based `requireRole()` checks on every write endpoint (`VIEWER` read-only, Company Settings `ADMIN`-only). Verified live: unauthenticated blocking, login success/failure, and all three role-gating scenarios. Remaining gap: no self-service password reset (see `KNOWN_ISSUES.md`). |
| 2 | **File uploads (logo/signature) won't persist on Vercel.** `api/upload` wrote to the local filesystem, ephemeral on Vercel serverless functions. | **Fixed (v0.9.1).** Uploads now go to Supabase Storage (`src/lib/supabaseStorage.ts`); `logoUrl`/`signatureUrl` validation updated to match. Requires the `uploads` bucket + `SUPABASE_SERVICE_ROLE_KEY` set up per `DEPLOYMENT_GUIDE.md` §3.5. |
| 3 | Every API route leaked raw Prisma/database errors (stack traces, unique-constraint messages, potential schema details) directly to the client on any unhandled failure. | **Fixed.** All 13 routes now catch and sanitize errors via a shared `withApiErrorHandling` wrapper; friendly message + correct HTTP status returned, original error still logged server-side. |
| 4 | Proposal creation (client lookup/create → number generation → proposal + items) ran as 3 separate, non-atomic database calls — a failure partway through could leave an orphaned Client record with no proposal. | **Fixed.** Now runs inside a single `prisma.$transaction`. |

## High Priority Issues

| # | Issue | Status |
|---|---|---|
| 5 | **Search was case-sensitive everywhere** (proposals, materials, clients, global search) — "john" would not match "John". | **Fixed** — `mode: "insensitive"` added to every `contains` filter. |
| 6 | **Dashboard "Total Value" summed every proposal status**, including DRAFT/REJECTED/CANCELLED, inflating the number well beyond actual won revenue. | **Fixed** — now filters to APPROVED + COMPLETED only, in both the API route and the dashboard page's own direct query. |
| 7 | Negative/invalid numbers could reach stored data: material prices, proposal discount/tax %, line-item quantity/price had no server-side non-negative or range validation — only cosmetic HTML `min`/`max` on the client, which don't stop a typed negative value or scripted request. | **Fixed** — server-side validation added on all four proposal/material write routes; discount/tax clamped to 0–100; client-side `onChange` handlers also clamp now, so the UI itself can't produce an invalid value. |
| 8 | `PUT /api/proposals/[id]` didn't validate `status` against the enum (only `PATCH` did) — an invalid value would crash with an unhandled Prisma error instead of a clean 400. | **Fixed.** |
| 9 | Global search's own placeholder text promised "clients, proposals, materials" but the Client table was never queried — a client with no proposals yet was unfindable. | **Fixed** — added the missing Client branch. |
| 10 | Proposal-number generation had a race condition (two concurrent creates could compute the same next sequence number) and no retry, so the loser of the race got a raw failure. | **Fixed** — `createWithProposalNumber` retries with a fresh number on collision (up to 3 attempts). |
| 11 | Proposal duplication always generated a `PROP-...` number regardless of the company's configured prefix (e.g. `EVT-...`). | **Fixed.** |
| 12 | Bulk material spreadsheet upload had no size/type validation (unlike the image upload route) and did 2+ sequential DB queries per row (N+1). | **Fixed** — size/extension checks added; category and existing-code lookups batched into bulk queries. |
| 13 | Uploaded SVG images are a stored-XSS vector (SVG can embed `<script>`; uploaded files are served directly from the app's own origin). | **Fixed** — SVG removed from accepted upload types (client and server); PNG/JPEG/WEBP only. |

## Medium Priority Issues

| # | Issue | Status |
|---|---|---|
| 14 | Company logo/signature URL fields accepted any arbitrary string, including external URLs — a vector for pointing the PDF export's `html2canvas({useCORS:true})` fetch at attacker infrastructure. | **Fixed** — validated as same-origin `/uploads/...` paths. |
| 15 | Client form: no email format or phone pattern validation; no name length caps. | **Fixed.** |
| 16 | Material form: negative cost/selling price accepted by client-side validation. | **Fixed.** |
| 17 | Upload modal: no client-side size/extension check — a large/wrong-type file fully uploaded before any rejection. | **Fixed** — checked before the request is sent. |
| 18 | `ImageUploadField`: Remove button not disabled during an in-flight upload — a fast click-then-remove could have the upload silently resurrect the image on completion. | **Fixed.** |
| 19 | PDF: Terms & Conditions section rendered even when empty (Notes already guarded against this). | **Fixed.** |
| 20 | Several list endpoints (`proposals`, `clients`, `materials`) had no upper bound on rows returned. | **Mitigated** — defensive `take()` caps added (500–1000 rows). Real pagination UI is a feature-scope item, tracked in `KNOWN_ISSUES.md`, not built in this pass. |
| 21 | `Material.isActive` (filtered on every materials list/search request) had no database index. | **Fixed** — migration added. |
| 22 | Company settings form: no format validation on GSTIN/PAN/IFSC, fields that print on every customer-facing PDF. | **Fixed** — format checks added before save. |
| 23 | Client/Material tables: long names had no truncation, could blow out row width. | **Fixed.** |

## Low Priority Issues / Technical Debt

- `findOrCreateClient` has a narrow race condition on brand-new clients with no unique DB constraint backing it — documented in `KNOWN_ISSUES.md` rather than fixed, since a proper fix requires first auditing production data for existing duplicate emails (a data decision, not a pure code change).
- Category names can duplicate by case ("LED Screen" vs "led screen") — cosmetic, low impact.
- Bulk material import is still row-by-row for the actual create/update (batched the *lookups*, not the writes) — fine at pilot catalogue sizes.
- Search uses `contains`, which can't use a plain B-tree index for substring matching at scale — a `pg_trgm`/full-text index is the eventual fix, unnecessary at pilot data volume.
- Prisma is on 5.22; 7.8 is available — deliberately not upgraded (major-version bump is its own risk-managed project, not bundled into a stability pass).
- README had two stale claims (Client Management "not built yet", logo upload "optional, not built") left over from before this pass — corrected.

## What was verified end-to-end (QA pass)

Ran a full production build (`next build`) and a live QA pass against the real Supabase database: every page load (Dashboard, Proposals, Materials, Clients, Settings, About, New Proposal), case-insensitive search across proposals/materials/global search, dashboard revenue math, negative-price rejection, invalid-status rejection, 404 friendly-error handling, full proposal lifecycle (create with clamped discount → duplicate with correct prefix → status change → preview render → delete), duplicate material-code rejection, bad file-extension rejection on both upload routes, SVG upload rejection, and malicious `logoUrl` rejection. All test data created during QA was cleaned up afterward; real production data (company profile, existing proposal/clients) was left untouched and verified intact.

**Not verified** (no headless browser available in this environment): dark mode visual rendering, PDF pixel-level output, and responsive layout at actual breakpoints. These should get a quick manual look in a real browser before go-live — the underlying logic (CSS classes, print pagination) was reviewed and is unchanged from the already-working Phase 1/2 implementation except for the one Terms & Conditions guard noted above.

## Future Recommendations (not for this release)

1. Add self-service password reset (needs an email-sending service) and an in-app user-management screen once the team grows past what one admin can manage via `scripts/set-password.ts`.
2. Add pagination UI once any list page's data volume genuinely warrants it.
3. Schedule a Prisma major-version upgrade as its own tested project (also resolves several transitive `npm audit` findings).
4. Revisit `findOrCreateClient`'s email uniqueness once real production data can be audited for existing duplicates.

---

## Declaration

**READY FOR PILOT RELEASE.** Both Critical items from the initial pass — no authentication, and non-persistent file uploads on Vercel — are now fixed and verified (v0.9.1). Remaining action before go-live is operational, not a code defect: create the Supabase Storage `uploads` bucket, set `NEXTAUTH_SECRET`/`NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` in the deployment environment, and change the seeded accounts' placeholder password (`DEPLOYMENT_GUIDE.md` §2–3.5).
