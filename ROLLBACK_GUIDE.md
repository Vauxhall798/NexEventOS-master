# Rollback Guide — v0.9 Pilot Release

## Application code rollback (Vercel)

Vercel keeps every previous deployment. If v0.9 misbehaves after go-live:

1. Vercel Dashboard → project → **Deployments**.
2. Find the last known-good deployment (the one before this pilot release, or an earlier point in this release if a later commit within it caused the issue).
3. Click **⋯ → Promote to Production** (or "Redeploy"). This is instant and does not require a new build.

If deploying outside Vercel: redeploy the previous Git commit/tag using your normal deploy process.

## Application code rollback (Git)

Every change in this pass is a separate, isolated commit (see `git log`) — you don't have to roll back the entire pass to undo one thing:

```bash
git log --oneline          # find the commit to revert
git revert <commit-sha>    # creates a new commit undoing that one — safe, preserves history
```

Avoid `git reset --hard` on a shared branch — it rewrites history and can silently drop other people's commits.

## Database rollback

**Schema migrations:** this pass added exactly one migration — `prisma/migrations/20260706084959_add_material_isactive_index` (adds an index only, no data change, no column drop). It's safe to leave in place even if you roll back the application code; an index is inert and doesn't affect old code. If you genuinely need to undo it: `DROP INDEX "Material_isActive_idx";` in the Supabase SQL editor — but there's no scenario in this release where you'd need to.

**No destructive migrations were made in this pass** — no columns dropped, no data transformed, no data deleted. This is the reason schema rollback is low-risk here.

**Data rollback:** Supabase Postgres has point-in-time recovery (PITR) if enabled on your plan — check **Supabase Dashboard → Database → Backups**. If something in production created bad data (not a schema issue, an actual bad write), PITR restore to a timestamp before the bad write is the correct tool, not a code rollback.

## Specific rollback scenarios

| Symptom | Likely cause | Rollback action |
|---|---|---|
| Every API request returns a generic "Something went wrong" | A real server error is now being caught and sanitized (working as designed) — check Vercel function logs for the underlying `console.error` output first. Only roll back if logs show the *error handling itself* is broken, not the underlying error. | Revert the "Harden API layer" commit only. |
| Proposal creation fails intermittently under concurrent use | Should be fixed by this release (proposal-number retry). If it's still happening, check logs for the actual error — may be an unrelated Supabase pooler limit. | Revert the transaction/retry commit; investigate Supabase connection pool size before re-applying. |
| Logo/signature uploads stop working or disappear after a deploy | Expected on Vercel's ephemeral filesystem — see `DEPLOYMENT_GUIDE.md` §7. Not a regression to roll back; it's a pre-existing gap this pass surfaced but did not change. | N/A — needs a storage-backend decision, not a rollback. |
| Search behaves unexpectedly (e.g. seems to match too much) | The case-insensitive search fix working as intended, just different from before. | Revert the search commit only if this is genuinely unwanted. |

## What to do immediately after any rollback

1. Note the rollback in your own incident log (not part of this repo) — what broke, what you rolled back to, what commit/deployment is now live.
2. Re-check `KNOWN_ISSUES.md` — a rollback may re-introduce an issue this pass fixed (e.g. reverting the API-hardening commit brings back raw Prisma error leakage).
3. Fix forward when possible rather than staying rolled back long-term — the fixes in this pass address real correctness/security gaps.
