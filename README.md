# NexEventOS

*Manage. Quote. Deliver. Grow.* — developed by NexInt AI.

A modern proposal-authoring tool for an event production company's sales team — pick materials from a master catalogue instead of retyping line items, and generate a client-ready PDF proposal in minutes.

Branding note: NexEventOS/NexInt AI is the *product's* branding (browser title, sidebar, About page). The tenant's own business details (logo, GST, bank details, signature — configured under Settings > Company Profile) appear only inside generated proposals, never in the app chrome.

**v0.9 Pilot Release** (first production pilot, for Sri Eswari Groups) — see [`CHANGELOG.md`](CHANGELOG.md), [`RELEASE_NOTES.md`](RELEASE_NOTES.md), [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md), [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md), and [`ROLLBACK_GUIDE.md`](ROLLBACK_GUIDE.md).

## Stack

- **Next.js 14** (App Router, TypeScript) — pages + API routes in one app
- **Prisma + Supabase Postgres** — `ProposalStatus`/`UserRole` are native Postgres enums, money/percent fields are `Decimal` (see `src/lib/db.ts` for the Decimal->number coercion that keeps the rest of the app working with plain numbers)
- **Tailwind CSS** — utility-first styling, dark mode via `class` strategy
- **xlsx** — parses `.xlsx`/`.csv` material uploads
- **jspdf + html2canvas** — client-side "Download PDF" export

## Getting started

```bash
npm install                         # installs deps, runs `prisma generate` automatically
# Add DATABASE_URL (pooled, port 6543) and DIRECT_URL (direct, port 5432) to .env —
# see .env.example. Get both from Supabase -> Project Settings -> Database.
npx prisma migrate dev              # creates tables/enums on your Supabase project
npm run db:seed                     # loads sample categories, materials, and one demo proposal
npm run dev                         # http://localhost:3000
```

Migrated from SQLite on 2026-07-05 — see `prisma/export-sqlite-data.ts` and
`prisma/import-postgres-data.ts` if you ever need to replay that migration
(e.g. onto a fresh Supabase project).

## Project layout

```
prisma/
  schema.prisma        # Material, Category, Client, Proposal, ProposalItem, User
  seed.ts               # sample data
src/
  app/
    page.tsx                       # Dashboard
    materials/page.tsx             # Material Master
    proposals/page.tsx             # Proposal History
    proposals/new/page.tsx         # New Proposal
    proposals/[id]/edit/page.tsx   # Edit Proposal
    proposals/[id]/preview/page.tsx# Proposal Preview (print/PDF)
    api/                           # REST endpoints (materials, proposals, categories, search, dashboard)
  components/
    layout/    # Sidebar, Topbar, GlobalSearch, DashboardShell
    materials/ # Material table, add/edit modal, upload modal
    proposals/ # Editor, material picker, items table, summary, preview document
    dashboard/ # Stat cards, recent proposals table
    ui/        # Button, Card, Input, Modal, Badge, Spinner, ConfirmDialog
  lib/         # prisma client, calculations, proposal numbering, xlsx parsing
```

## Notes on scope

- **Auth/Users**: NextAuth (email/password, JWT sessions) gates every page and API route — see `src/middleware.ts` and `src/lib/auth.ts`. Roles (`ADMIN`/`SALES`/`MANAGER`/`VIEWER`) are enforced server-side: `VIEWER` is read-only, `Company Settings` is `ADMIN`-only. No self-service password reset yet — see `scripts/set-password.ts` and `KNOWN_ISSUES.md`.
- **Clients**: proposals create/link a `Client` row automatically from the form fields; `Client Management` (`/clients`) is a full standalone screen (list, detail, edit, delete, revenue/status stats).
- `Proposal.status` and `User.role` are native Postgres enums (`ProposalStatus`, `UserRole`) as of the Supabase migration — see `src/lib/proposalStatus.ts` for the app-layer labels/styles/type-guard built on top of them.
- **Modularity**: the sidebar already reserves nav slots ("Coming soon": CRM, Purchase Orders, Inventory, Invoicing) and the schema's `Client`/`User` tables are normalized so those future modules can be added without reshaping existing data.
- **Company branding**: logo and signature upload are implemented (Settings > Company Profile, PNG/JPEG/WEBP up to 5MB) and appear on every generated proposal PDF.
- Not built in this pass: material image upload (schema has `Material.imageUrl` as a hook for it), multiple proposal templates, version history, and emailing a proposal directly to the client.
