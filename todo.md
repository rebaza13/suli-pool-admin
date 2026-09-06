# Suli Pool Admin — Fix & Remaster Progress

See `docs/context.md` for the full investigation (live schema introspection, live-tested bugs) and `docs/CLAUDE.md` for the short operating rules. Pulled fresh from GitHub 2026-09-07 with "a ton of mistakes" reported — this tracks the fix-and-remaster pass.

## P0 — was completely broken, blocks the client's #1 ask (dynamic team avatars)

- [x] Diagnosed: every image upload (Hero/About/Installation/Timeline/Projects/Site-sections/Team avatars) fails with `row-level security policy` — `storage.objects` has no write policy for the `site-images` bucket.
- [x] Wrote `enable_storage_rls_policies.sql` (repo root) — adds authenticated INSERT/UPDATE/DELETE + public SELECT for the `site-images` bucket.
- [ ] **Needs the client/owner to run this SQL file in Supabase → SQL Editor** — cannot be applied via the anon/service REST API, only the dashboard SQL editor or a DB connection string, neither of which this session has.
- [ ] Re-verify live after it's run: upload a real photo for one of the 6 team members end-to-end.
- [x] Confirmed Company & Team page's add/edit/delete/upload UI was already fully built (create, edit, delete, photo upload, max-2-images-style validation elsewhere) — this was a permissions bug, not a missing feature.

## P0 — data-corrupting / feature-breaking bugs

- [x] Fix Timeline event creation: `timeline_items.section_key` is NOT NULL and was never set → every "Add Event" failed. (fixed in `timeline-store.ts` + `TimelinePage.vue`)
- [x] Fix About Section NOT NULL landmine: default missing-locale/blank translation fields to `''` not `null` (`about-store.ts`, `AboutSectionPage.vue`).
- [x] Fix orphaned `media_assets` rows: `hero-store.ts` `deleteHeroSlide` didn't clean up `media_assets`; `deleteHeroSlideImage` and `site-section-store.ts` `deleteSiteSectionImage` deleted `media_assets` with no cross-table check (copy `about-store.ts`'s safe pattern).
- [x] Fix `timeline-store.ts` `deleteEventImage` delete ordering (link row before asset row, matching every other store).

## P1 — cleanup that removes real risk/latency

- [x] Delete `table-resolver.ts` and hardcode table names in `installation-store.ts`, `timeline-store.ts`, `locations-store.ts` (real schema is confirmed stable; the runtime probing only adds latency and a caching footgun).
- [x] Delete dead scaffold files: `IndexPage.vue`, `ExampleComponent.vue`, `models.ts`, `example-store.ts`, `EssentialLink.vue`, `hero-schema-helper.ts`, `stores/types/database.types.ts`.
- [x] Remove the orphaned `/features` route + `DashboardPage.vue` (unreachable from the sidebar) — or wire it up if the client actually wants a dashboard landing page (ask first).

## P1 — Sidebar/header redesign (requested mid-session)

- [x] Redesigned the sidebar as a dark-navy panel (`$color-primary`) with a teal pill highlight (`$color-secondary`) for the active route, replacing the light gradient + left-border-accent style.
- [x] Found and fixed a real pre-existing layout bug while doing this: the drawer sits *behind* the fixed top header (`view="hHh LpR fFf"`), so its first ~69px — including the old "Menu" label + collapse-toggle row, and now the "Hero" nav item itself — was rendered invisible/unclickable underneath the header. Fixed by giving `.sidebar-content` top padding equal to the header's height, and by moving the collapse-toggle button up into the always-visible top header (next to the mobile hamburger) instead of leaving it in the now-removed sidebar-only header row.
- [x] Cleaned up the header: user email is now a small avatar-initial chip instead of bare text, subtle bottom border instead of a drop shadow, slightly more breathing room.
- [x] Verified: desktop expanded, desktop collapsed (mini, icon-only), and mobile overlay drawer (420px viewport) all render correctly with no clipped/hidden items.

## P1 — UX/UI fixes (the "clean, lean, perfect" ask)

- [x] Fix sticky error banner on About/Company&Team pages blocking the whole list after a failed mutation (mutation catch blocks no longer overwrite `store.error`, which is reserved for fetch failures; mutation failures still surface via `$q.notify`).
- [x] Add `rel="noopener noreferrer"` to Social Media's `target="_blank"` links.
- [x] Add client-side required-field validation to `CompanyStatisticsPage.vue` (`label_en`, `value`) to match every other page's pattern.
- [x] Remove decorative dead "Remember me" / "Forgot password" controls on the login page (no backend wiring exists for either; removed rather than fake-implemented).
- [x] Reskin `ErrorNotFound.vue` to match the app's actual design tokens instead of default Quasar scaffold styling.
- [ ] Remove leftover `console.log` debug statements in `HeroPage.vue`.

## P2 — larger structural refactor (deferred, tracked not started)

- [ ] Consolidate ~5,000 lines of duplicated CSS (`.status`, `.locale-badge`, `.translation-item`, `.image-upload-area`, `.images-grid`, responsive-dialog-card rules copy-pasted across 8–10 `css/sections/*.scss` files and inline page styles) into shared partials or components (`StatusBadge.vue`, `ImageGrid.vue`, `TranslationEditor.vue`, `EmptyState.vue`).
- [ ] Regenerate `database.types.ts` properly via `supabase gen types typescript` if/when typed Supabase calls are wanted (deleted the stale hand-written one rather than fix it).
- [ ] Organize the repo-root SQL scratch files (`check-schema.sql`, `create_*.sql`, `enable_*.sql`, `DISCOVER-SCHEMA.md`, `SORT_ORDER_FIX.md`) into a `supabase-sql/` folder — some describe stale/wrong schemas (flagged in `context.md`) and should at minimum carry a "may be outdated, verify against live schema" note.

## Known content gaps (not code bugs — client's data)

- All 6 `team_members` rows have `image_url: null` — real headshots to be uploaded via the admin once the P0 storage fix is applied and confirmed.
- `about_section_translations.ar` looks like a copy of the `ckb` (Kurdish) text rather than real Arabic — worth flagging to the client.
- `suli-pool-front` has a stopgap `/admin/team` token-gated upload page (different bucket, service-role key) that predates this admin panel's Company & Team page — recommend retiring it once the real admin flow is confirmed working end-to-end. Not touched in this pass (out of scope: that's the front-end repo).
