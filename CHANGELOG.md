# Changelog

All notable changes to NexEventOS are documented in this file.

## [0.10.0] — Proposal Editor Enhancements (2026-07-06)

### Added
- **Client autocomplete.** The Client Name field on the proposal editor now suggests matching clients as you type (or on focus, showing recent clients) — selecting one auto-fills company, contact person, email, and phone. Existing client-linking behavior (matching by email, falling back to name) is unchanged; this just saves re-typing details for a repeat client.
- **Custom/ad-hoc line items.** "+ Add Custom Item" on the proposal editor adds a blank, fully-editable line item that doesn't need to exist in the Material Master — material name and unit are now editable inline for every row (previously only description/quantity/rate were).
- **Editable Round Off.** A new "Round Off" field on the proposal summary lets you manually adjust the grand total (e.g. to a whole number) — a small button suggests the nearest-whole-number correction, or you can type any adjustment directly. Stored on the proposal (`Proposal.roundOff`, defaults to 0) and shown on the PDF/preview only when non-zero. Clamped server-side to +/-9999 (it's for rounding, not a hidden discount).

## [0.9.1] — Authentication & Persistent Storage (2026-07-06)

Closes the two Critical items flagged in the v0.9 Pilot Release Report as needing a decision before real go-live.

### Added
- **Authentication.** NextAuth email/password login (JWT sessions), gating every page and API route via `src/middleware.ts`. Unauthenticated page requests redirect to `/login`; unauthenticated API requests get a clean `401` JSON response.
- **Role-based authorization.** `VIEWER` is blocked from every write endpoint (read-only); `Company Settings` is `ADMIN`-only; all other writes (proposals, clients, materials, categories, uploads) allow `ADMIN`/`SALES`/`MANAGER`. Enforced server-side via `requireRole()`, not just hidden in the UI.
- Sidebar/Topbar are now session-aware: real signed-in user + role + sign-out replace the previously hardcoded "Priya Sharma" placeholder; `Settings` and `New Proposal` nav items are hidden for roles that can't use them.
- `scripts/set-password.ts` — command-line password set/reset for a user (no email/forgot-password flow exists yet).
- Seed script now sets an initial password on the seeded admin/sales accounts.
- **Persistent file storage.** Logo/signature uploads now go to Supabase Storage instead of the local filesystem, which didn't persist on Vercel's serverless functions (flagged in the v0.9 report). `src/lib/supabaseStorage.ts` wraps upload + public-URL generation; `logoUrl`/`signatureUrl` validation updated to match the new URL format.

### Changed
- `User.passwordHash` added (nullable — an account with no hash can never authenticate; this isn't a bypass).

## [0.9.0] — Pilot Release (2026-07-06)

First production pilot release, prepared for Sri Eswari Groups. This release contains no new business features — it hardens the application (built in Phase 1/Phase 2, migrated from SQLite to Supabase Postgres) for real-world use.

### Fixed
- **Search was case-sensitive.** `contains` filters across proposals, clients, materials, and global search lacked `mode: "insensitive"` — searching "john" would not match "John" anywhere in the app.
- **Dashboard "Total Value" was wrong.** It summed `grandTotal` across every proposal status, including DRAFT, REJECTED, and CANCELLED, inflating the figure with value that was never actually won. Now sums only APPROVED/COMPLETED proposals.
- **Global search silently dropped Clients.** The search bar's own placeholder text promised "clients, proposals, materials," but the endpoint never queried the Client table — a client with no proposals yet was unfindable.
- **Proposal duplication ignored the configured proposal-number prefix**, always generating a `PROP-...` number even if the company profile was set to a different prefix (e.g. `EVT-...`).
- **Negative/invalid numbers could reach stored totals.** Material cost/selling price, proposal discount %, tax %, and line-item quantity/rate had no non-negative or range validation on the server, only cosmetic HTML `min`/`max` attributes on the client that don't stop a typed negative value. A discount over 100% or a negative price could previously produce a negative grand total.
- **PUT `/api/proposals/[id]` didn't validate `status`** against the enum (PATCH did) — an invalid value would crash instead of returning a clean 400.
- **Proposal PDF rendered an empty "Terms & Conditions" section** when none was set, unlike the Notes section which already guarded against this.

### Security
- Removed SVG from accepted upload types. SVG is an XML format that can embed `<script>`/event handlers; uploaded files are served directly from `/uploads/` at the app's own origin, so an uploaded SVG opened directly would execute script in that origin (stored XSS). Logo/signature uploads are now PNG/JPEG/WEBP only.
- Company logo/signature URLs are now validated as same-origin `/uploads/...` paths before being saved, closing off a path for pointing the PDF export's `html2canvas({ useCORS: true })` fetch at arbitrary external infrastructure.
- Every API route now catches and sanitizes errors before responding — previously an unhandled Prisma error (unique/foreign-key violation, connection drop) propagated its raw internal message to the client.

### Changed
- Proposal creation (find-or-create client → generate proposal number → create proposal + items) now runs inside a single database transaction. A failure partway through no longer leaves an orphaned Client record with no proposal.
- Proposal-number generation now retries on a rare concurrent-collision instead of failing the request outright.
- Bulk material spreadsheet import now pre-fetches categories/existing codes in bulk instead of one query per row, and validates size/extension/non-negative prices before processing.
- Added a database index on `Material.isActive` (filtered on every materials list and search request).
- Reduced over-fetching on a few list endpoints (dropped an unused `items` include on proposal lists; narrowed the fields selected for a client's nested proposals).
- Pinned Node.js to `20.x` (`engines` in `package.json`, `.nvmrc`) — Next.js 14.2 predates Node 24 and we observed dev-server compiler-worker crashes under it.

### Added
- Friendly, consistent error responses across all 13 API route handlers with correct HTTP status codes (400/404/409/500), instead of raw framework/database errors.
- Client-side form validation: email/phone format checks on the client form, negative-price rejection on the material form, file size/extension pre-checks before upload, GSTIN/PAN/IFSC format checks on the company profile form.
- `CompanySettings` is now explicitly seeded (previously only ever lazily created with defaults on first read).

## [0.2.0] — Supabase Postgres Migration
SQLite → Supabase Postgres migration. `ProposalStatus`/`UserRole` became native Postgres enums; money/percent fields became `Decimal`.

## [0.1.0] — Phase 1 & 2
Initial build: Material Master, Proposal authoring/editing/duplication/status workflow, PDF generation, Dashboard, Client auto-linking, Company Settings.
