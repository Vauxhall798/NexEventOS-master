# NexEventOS v0.9 — Pilot Release Notes

**Customer:** Sri Eswari Groups
**Release type:** First production pilot
**Date:** 2026-07-06

## What this release is

NexEventOS v0.9 is the first version of the application intended for real day-to-day use by a real customer. Phase 1 (Material Master + Proposal authoring) and Phase 2 (Client management, Dashboard, workflow) were already functionally complete, and the app has already been migrated from SQLite to Supabase Postgres. This release does not add features — it is a hardening pass across the existing application: correctness fixes, input validation, transactional data integrity, security fixes, and documentation, so the app is safe to hand to real users.

## Who should read what

- **Sales team using the app day-to-day:** see "What changed for you" below.
- **Whoever deploys/hosts this:** see [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md).
- **If something goes wrong after deploying:** see [`ROLLBACK_GUIDE.md`](ROLLBACK_GUIDE.md).
- **Full technical detail on every fix:** see [`CHANGELOG.md`](CHANGELOG.md).
- **What's deliberately not fixed yet, and why:** see [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md).

## What changed for you (functional fixes you'll notice)

- **Search now works regardless of capitalization.** Searching "raj" now finds "Raj", "RAJ", etc. — this applies to the top search bar and every list page's search box.
- **The dashboard "Total Value" number is now accurate.** It previously included draft and rejected proposals in the total; it now only counts proposals marked Approved or Completed.
- **The top search bar now finds clients**, not just proposals and materials.
- **You can no longer accidentally enter a negative price, negative quantity, or a discount over 100%** — the form will stop you, and so will the server even if it somehow got past the form.
- **Uploading a bad file (wrong type, too large) is now rejected immediately**, before the file finishes uploading, with a clear message.
- Error messages across the app are now consistently friendly ("Client name is required", "That material code is already in use") instead of occasionally showing a raw technical error.

## What did not change

- No new pages, modules, or workflows.
- No visual redesign — spacing/typography/color fixes were limited to genuine inconsistencies (see `CHANGELOG.md`), not a restyle.
- No authentication/login was added. The app still assumes a single trusted user, as before. See `KNOWN_ISSUES.md` for what this means for the pilot and what's already in place for when auth is added later.

## Before go-live checklist

1. Confirm `Settings > Company Profile` has Sri Eswari Groups' real GST number, PAN, bank details, and signature filled in (these print on every proposal PDF).
2. Confirm the Supabase project used is the intended production project, not a dev/test project.
3. Read `KNOWN_ISSUES.md`, in particular the "no authentication" item — decide if that's acceptable for the pilot's user base (e.g. an internal-network-only deployment, or a small trusted team) before going live publicly.
4. Run through `DEPLOYMENT_GUIDE.md` end to end once in a staging environment before pointing the real domain at it.
