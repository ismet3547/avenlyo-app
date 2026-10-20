# Focused onboarding and operational Home

This change continues PR #6 from `9b4347251c71b95fed7f08d8e5558cfa652f5d78`. It changes first-time setup, `/app`, their necessary shell/state behavior, and associated tests. Other product pages retain their existing behavior.

## Experience and reused behavior

`/app` sends an unfinished workspace to `/onboarding`. Setup uses the Avenlyo brand, workspace/account controls and one expanded task in a 780px working column. Normal navigation appears after activation. Existing deep links remain usable in the minimal shell, with a Back to setup link; this preserves working Knowledge and Agent flows. The shared shell keeps its main subtree mounted when activation reveals normal navigation, so ordinary form saves retain their success feedback.

1. **Agent:** a short form saves the existing setup brief, tone and contact requirements through `saveAgent` / `save_agent_settings`. Existing goals and mandatory human assistance remain intact. Advanced configuration stays on Agent.
2. **Knowledge:** choose manual entry, webpage import or file upload. All six supported types use `KnowledgeForm` and the existing save/import/publish actions. Imports remain drafts; saved drafts can be reviewed, edited and explicitly published. Collection data is preserved when the compact editor hides collection selection.
3. **Test:** the existing `TestAgent`, API route and runtime perform the actual turn. The focused variant hides runtime/context panels. A successful response exposes **Looks good, continue**; unsuccessful requests retain the real retry behavior.
4. **Channel:** Website Chat first prepares an approved-origin configuration while disabled, exposes its real install snippet, then activates through `saveWebsiteChannel` / `configure_website_channel`. Instagram keeps its existing managed provisioning process. No self-service Instagram authorization is invented.

The completion screen offers **Go to Home**. Setup uses normal labelled forms, visible focus, semantic headings, 44px actions and the existing reduced-motion rules. Manrope assets and their license are restored from this repository's earlier design commit and scoped to setup/Home.

## Persistence and exact completion logic

Migration `20261020102548_focused_onboarding_home.sql` adds only `workspaces.onboarding_completed_at` and two workspace-scoped RPCs. Existing table grants/RLS and runtime/provider functions are unchanged. No production/hosted database was modified while preparing this change.

`sync_onboarding` checks active workspace membership and derives the milestones from persisted product state:

- Agent: a nonempty saved setup brief **or** agent settings updated after workspace creation.
- Knowledge: at least one item whose status is `published`.
- Test: a completed `agent_runs` record belonging to a `test_agent` conversation, with a nonempty customer question and persisted reply. Empty, processing and failed sessions do not count.
- Channel: an enabled Website Chat connection in `ready`/`connected` state with approved origins, **or** enabled Instagram in `connected` state with `verified_at` present.

When all four are true, the RPC records completion once under a workspace row lock. It never clears that timestamp. Subsequent knowledge edits, configuration changes, channel disconnections or outages therefore cannot route that workspace back to onboarding. Progress is rederived on return visits; URL parameters cannot skip unfinished prerequisites. The Website Chat activation action synchronizes the milestone immediately.

Existing workspaces with all four pieces of evidence qualify on their first visit. Historical completion before this milestone existed cannot be established reliably if the old evidence has already been removed. No speculative backfill is applied. Website activation confirms the real enabled, approved-origin configuration; it cannot prove that someone installed the snippet on their external website.

## Home selection and responsive behavior

`home_snapshot` selects only real inbound customer conversations, scoped by verified workspace membership. Test sessions and their leads never appear.

- **Needs your attention:** paused AI, an outstanding/claimed handoff, or unresolved failed/unknown/blocked message delivery. The full workspace queue supplies the count, then only its three oldest waiting conversations are returned. Ordering uses the earlier of handoff time and the first unresolved delivery failure, with last customer/creation times as fallbacks and ID tie-breaking. The preview is the latest customer message, never an assistant reply. Known lead names are used; otherwise the UI says Website visitor or Instagram customer.
- **Recent:** one latest meaningful activity per conversation, selected from customer questions, human replies, handoffs, qualified inquiries and shared contact details. The latest five conversations are returned with stable tie-breaking. Customer questions use a real excerpt rather than invented intent classification.
- **Health:** actual `needs_attention` states remain visible even when a provider failure disables the channel. Previously verified/used channels going offline also generate a compact alert. If an activated workspace has no active inbound channel, Home reports that real serving failure. A merely unconnected optional channel generates no individual alert.

Desktop shows at most three attention rows and five Recent rows. At 640px and below it shows two and four respectively, retains the same content order, and uses a full-width Inbox action. The total attention link still points to Inbox. Empty attention/Recent states are compact, contain no sample data, and adjust their wording when all channels are offline. Home has no setup checklist, metrics, charts, lead preview or Test Agent promotion.

## Validation and local review

Use the repository's pinned Node/pnpm versions and normal disposable Supabase stack described in `docs/local-development.md`. Apply the new migration with `supabase migration up --local`; keep existing local data. Build, then run `pnpm test:browser` with no manual process owning ports 3001 or 4001.

The implementation adds unit routing/presentation tests, extends all three existing browser flows for the changed behavior, and adds `supabase/tests/database/onboarding_home.test.sql`. The database assertions cover draft/failed-test rejection, durable completion, global attention ordering beyond fifty newer conversations, bounded/deduplicated Recent, and unauthorized access.

Local checks in this sandbox passed typecheck, lint/independence, all **122 unit tests**, and the production build. The build required a temporary external preload because this sandbox lacks `/proc` memory reporting; no workaround is included in the repository. A separate PGlite PostgreSQL check executed the new migration against isolated schema fixtures and passed state, queue, deduplication and access checks. It does not replace the full Supabase RLS/pgTAP suite.

This sandbox has no Docker/Supabase stack or installed browser. The local browser acceptance command could not start its fixture server, and the browser download was unavailable. The existing PR's CI is the appropriate full-stack validation environment; consult its checks for the final result. No PR merge or hosted deployment is part of this change.

For visual review, create a workspace and follow `/onboarding`, reload after each milestone, reopen completed tasks, and inspect at 1440px and 390px. After activation inspect empty Home, a handoff queue and a channel failure. Existing development-only `/preview` Home states remain available. Browser acceptance captures onboarding, Home and the existing product screens when run in the full local/CI environment.

## Files changed

- Routing/state: `apps/web/app/app/{layout,page}.tsx`, `apps/web/app/onboarding/{layout,page,actions,error,loading}.tsx` (the action module is `.ts`), `apps/web/lib/{onboarding,onboarding-model,home-model,product-data}.ts`, `apps/web/proxy.ts`.
- UI: `apps/web/components/{onboarding,setup-shell,overview,app-shell,conversations,product-forms}.tsx`, `apps/web/app/globals.css`, `apps/web/app/preview/page.tsx`, `apps/web/public/fonts/{manrope-regular.ttf,manrope-bold.ttf,OFL.txt}`.
- Reused-action adaptation: `apps/web/app/app/knowledge/actions.ts` adds a fixed onboarding return destination and revalidation; existing regular destinations remain intact.
- Database/types: `packages/shared/src/database.ts`, the new migration, and `supabase/tests/database/onboarding_home.test.sql`.
- Tests: `apps/web/app/{app,onboarding}/page.test.ts`, `apps/web/app/app/layout.test.ts`, `apps/web/lib/{onboarding-model,home-model}.test.ts`, the existing three `apps/api/src/testing/browser/*.spec.ts` flows, and `vitest.config.ts` for the application path alias.
- Review notes: this file.
