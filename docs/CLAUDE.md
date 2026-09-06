# Suli Pool Admin — AI/Dev Operating Notes

Read `context.md` for the why and the full list of known bugs. This file is the short, actionable version.

## Before touching anything

1. **Run `enable_storage_rls_policies.sql` in the Supabase SQL Editor first** if it hasn't been run yet — every image upload feature (Hero, About, Installation, Timeline, Projects, Site Sections, Company & Team avatars) is silently broken without it. Confirm by trying to upload a team member photo; if it still throws `row-level security policy`, the migration hasn't been applied.
2. There's a live dev server pattern already established: `npm run dev` (Quasar), served on `http://localhost:9000`. `.env` already has real Supabase creds.
3. A throwaway test admin login exists: `claude-agent-test@sulipool.com`. Use it (or ask the user) rather than guessing at the two real admin accounts' passwords.

## Patterns to follow

- **Every CRUD page follows the About/Company&Team shape**: loading spinner → error banner → empty state → list, plus a `q-dialog` create/edit form with `$q.notify` on success/failure and a `$q.dialog({...}).onOk()` confirm before delete. Match this exactly for consistency — don't invent a new pattern for a page you're touching.
- **Real table names, not guessed ones.** `location` is singular, `installations`/`installation_translations`/`installation_images`, `timeline_items`/`timeline_item_translations`/`timeline_item_images` (with a required `section_key` text column and integer `year`). Don't reintroduce `table-resolver.ts`-style runtime probing — it's being removed as dead complexity; hardcode names like every other store already does.
- **NOT NULL text columns default to `''`, never `null`.** Confirmed live for `about_section_translations` (every text column is NOT NULL) — this is likely true of other `*_translations` tables too. When building an insert/upsert payload, default missing/optional text fields to empty string, not `null`, unless you've confirmed the column is actually nullable in the live schema (check via the PostgREST OpenAPI spec at `<SUPABASE_URL>/rest/v1/`, not the stale `create_*.sql`/`DISCOVER-SCHEMA.md` files at repo root — those predate or don't match the live DB).
- **Image delete must check cross-table references before deleting the `media_assets` row**, the way `about-store.ts`'s `deleteAboutImage` does (check every `*_images` join table for the same `media_asset_id` before deleting the underlying asset + storage object). Copy that function's shape, don't write a naive unconditional delete.
- **Locale codes are `en`/`ar`/`ckb`** everywhere in this codebase (matches `suli-pool-front`'s convention) — never `ku`.
- Image uploads always go through `useImageCompression.ts`'s `compressImage`/`compressImages` before hitting storage — every existing store does this, keep doing it.

## Layout gotcha

`MainLayout.vue`'s `q-layout` uses `view="hHh LpR fFf"`, which makes the left drawer render *behind* the fixed header (both start at viewport `y: 0`) rather than below it. `.sidebar-content` has top padding sized to the header's height (68px toolbar + 1px border) specifically to compensate — if you change the header's height/min-height, update that padding (`css/sections/dashboard.scss`) to match, or the first one or two sidebar items will render invisible/unclickable under the header again (this was a real, confirmed bug found and fixed in this pass).

## Don't

- Don't add a new page-level scoped `<style>` block that reinvents `.status`, `.locale-badge`, `.translation-item`, `.image-upload-area`, `.images-grid`, or the responsive-dialog-card rules — these already exist (copy-pasted) in every `css/sections/*.scss` file. If you're touching one of these blocks, prefer consolidating into a shared partial over adding a 9th copy.
- Don't trust `create_installation_timeline_tables.sql`, `create_locations_tables.sql`, `check-schema.sql`, or `DISCOVER-SCHEMA.md` at the repo root as current schema truth — they're historical scratch notes from before the schema settled and at least one (`create_installation_timeline_tables.sql`) describes tables that don't exist in production. Trust the live OpenAPI spec or a live `select` instead.
- Don't re-add `sort_order` to any INSERT/UPDATE payload for `hero_slides`, `installations`, `timeline_items`, `projects`, `why_we_different`, `site_section`, or `social_links` — it's a `GENERATED ALWAYS` identity column on those tables (see `SORT_ORDER_FIX.md`). `team_members.order_index` and `company_statistics.order_index` are plain editable integers — that's a different, unrelated column, don't confuse the two.

## Did this documentation cover everything important?

Yes, with these caveats. Covered: full page/store map, the shared CRUD pattern, the confirmed storage-RLS root cause (live-tested, not guessed), the Timeline NOT-NULL bug, the About-section NOT-NULL landmine, the orphaned-media-assets class of bug, the dead-code list, and the CSS-duplication scope.

**Not covered / deliberately deferred** (see `todo.md` for priority order):
- The ~5,000-line CSS de-duplication into shared partials/components — large, lower-risk-to-defer, not attempted wholesale in the first pass.
- Regenerating a real `database.types.ts` via `supabase gen types typescript` (the existing one is stale and unused — deleted rather than fixed, since nothing imports it).
- Any content-quality fixes (duplicate ar/ckb About text, seeded placeholder copy) — those are the client's data to fix, not code bugs.
