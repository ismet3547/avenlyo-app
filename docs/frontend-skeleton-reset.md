# Frontend skeleton reset

Branch: `codex/frontend-skeleton-reset`. Base: current Agent V2
`38ceab54ab3b2972583c1a2c2c97790596d00ae2` on `codex/agent-v2`.
Agent V2 PR #7 remains draft and unmerged, so the new reset PR targets that branch.

## Scope

This is a presentation reset. Runtime/services, APIs, authentication actions,
workspace membership, all server actions, data loaders, Supabase migrations/schema,
RLS, provider verification, Agent scope/languages/routing, persisted conversation
ownership, handoff, lead capture, and onboarding milestone rules are unchanged.
Home still derives READY/LIVE/offline from the same model and data.

## Removed

- `apps/web/app/app/agent/agent.css` (371 lines)
- `apps/web/app/app/knowledge/knowledge.css` (840 lines)
- `apps/web/app/preview/page.tsx` and `fixtures.ts`: development-only visual experiment,
  not product routes or user data. Reference search found no production dependency.
- `apps/web/public/fonts/manrope-regular.ttf`, `manrope-bold.ttf`, and `OFL.txt`:
  referenced only by the removed visual styles.
- Unused `Step` and decorative `Avatar` helpers, logo artwork, navigation rail and
  contextual-sidebar duplication, status dots/pills, decorative conversation icons,
  Test Agent promotional panel and animated placeholder compositions.

## Shared foundation

`apps/web/app/globals.css` is the only application stylesheet. It replaces 4,785
lines of shared/Agent/Knowledge styling with 954 lines of neutral shared primitives
and essential interaction structure (about 80% fewer CSS lines). White surfaces,
near-black text, gray metadata/borders, a system sans-serif stack, 28/20/16px
headings, 15px body, simple controls, native focus outlines, dialogs, and basic
responsive structure replace route-specific typography, brand colors, shadows,
gradients and animation.

The basic shell has one desktop text menu and a native mobile navigation dialog.
All nine destinations, workspace selection, workspace creation and sign-out remain.
The form subtree stays mounted when onboarding completion reveals navigation.
Pages share a 1200px container with 24px desktop / 16px mobile padding. Component
class names remain as workflow/test hooks; they do not load separate themes.

Only necessary interaction structure remains: Inbox list/thread/context columns,
mobile conversation switching, plain responsive lead records, source labels,
composer, Agent summary rows and
tabs, Knowledge lists/filter placement, and native dialogs/popovers. Existing
keyboard handling, focus restoration, Escape, dirty-edit guards, actions, validation,
search/filter state, pagination, polling, retry and handoff controls are retained.

## Validation

Run typecheck, lint/independence, unit tests and production build. Build before
Playwright. The existing CI runs real disposable Supabase Foundation acceptance,
both upgrade paths, current runtime acceptance, pgTap security/isolation, channel
acceptance and all five production-server browser flows.

Behavioral assertions are retained. The only replaced visual constants are the old
Knowledge-specific page insets, now the shared 24/16px container. Browser coverage
also checks lead search/qualification filtering at 768px, all nine mobile
navigation destinations, workspace/account access,
Escape/focus restoration and page overflow. Product captures now include 1024px
alongside 1440/768/390; Agent and Knowledge flows retain their existing responsive
and dialog/keyboard coverage. Final exact results, HEAD and CI links are recorded
in the draft PR and handover.

Local Next memory reporting is restricted by this sandbox. A scratch-only reporting
fallback is used for local builds; it is not committed or needed by CI. Docker and
Supabase CLI are unavailable locally, so complete database/browser validation uses
CI's disposable stack. No production database or provider connection is modified.

## Local review

Fetch/switch to the reset branch, keep existing local data, and apply any pending
Agent V2 migrations with `supabase migration up --local` if not already applied.
Then build and run the normal web/API services as described in local development.
The old `/preview` route has been removed; review actual product pages.

Check sign-in/up, workspace selection/creation, all onboarding milestones and the
optional channel step, READY and LIVE Home, Agent creation/editing/scope/languages,
Test Agent/history, Knowledge editors/lifecycle/collections/imports, Channels and
Agent assignment, Inbox claim/release/pause/resume/reply, Leads and Settings.
Inspect 1440/1024/768/390px. The result is deliberately plain and unfinished.

## Remaining frontend debt

- Legacy semantic class names and a few local inline spacing hints are kept to
  avoid coupling this reset to product refactors. They can be migrated during the
  manual design pass.
- Read-only fixture flags on reusable components remain compatible with existing
  tests; their development-only visual preview route is removed.
- Historical design milestone documents/screenshots describe prior work and are
  not part of the shipped frontend.
- The public embedded website widget is owned by the API bundle and is unchanged;
  changing that separate surface would require a separately scoped pass.

## Changed files

- `apps/api/src/testing/browser/channels.spec.ts`
- `apps/web/app/app/agent/agent.css`
- `apps/web/app/app/agent/layout.tsx`
- `apps/web/app/app/channels/page.tsx`
- `apps/web/app/app/knowledge/knowledge.css`
- `apps/web/app/app/knowledge/layout.tsx`
- `apps/web/app/app/knowledge/loading.tsx`
- `apps/web/app/app/loading.tsx`
- `apps/web/app/app/settings/page.tsx`
- `apps/web/app/auth/sign-in/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/preview/fixtures.ts`
- `apps/web/app/preview/page.tsx`
- `apps/web/app/workspaces/page.tsx`
- `apps/web/components/app-shell.tsx`
- `apps/web/components/conversations.tsx`
- `apps/web/components/leads-list.tsx`
- `apps/web/components/overview.tsx`
- `apps/web/components/ui.tsx`
- `apps/web/public/fonts/OFL.txt`
- `apps/web/public/fonts/manrope-bold.ttf`
- `apps/web/public/fonts/manrope-regular.ttf`
- `docs/frontend-redesign.md`
- `docs/frontend-skeleton-reset.md`

The installed Next.js package also emitted a local security-upgrade advisory.
Dependency upgrades are outside this presentation reset; the plain CI build passes.
That advisory should be assessed separately before production rollout.
