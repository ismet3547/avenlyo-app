# Frontend rebuild V2 — implementation

Date: 2026-10-18
Branch: `feat/frontend-rebuild-v2`
Research: `docs/frontend-rebuild-research-v2.md` and `docs/uiux-deep-research-2026-10-18.md`

## What changed

The interface now centers daily work around Home, Inbox and Leads. Agent settings, Knowledge and Channels form a separate preparation group. Test history lives with Test Agent instead of duplicating the customer Inbox in primary navigation.

- A new warm neutral / forest green design system, checked-in Geist variable font and its OFL license, responsive shell, accessible mobile dialog, account menu and skip link.
- Home adapts to customer activity. Customer metrics exclude Test Agent records. Setup guidance uses real published knowledge and channel state; it does not infer agent readiness from an internal note or timestamp.
- Inbox keeps the customer queue beside an open conversation on wider screens. Mobile opens one focused surface with a return path. Search and ownership / AI-paused filters apply to the loaded page of up to 50 conversations, and travel with conversation links. Customer identity, AI mode, ownership, linked lead and delivery evidence stay explicit.
- Claiming reveals the human composer. Releasing keeps AI paused; resuming applies to the next customer message. Conversation details and staff notification diagnostics are disclosed on demand.
- Agent goals, tone and contact collection are structured controls. Human handoff stays mandatory. Disabling contact collection omits contact requirements. The internal setup note is explicitly not a runtime prompt. Unsaved settings are distinguished from the saved settings used in tests.
- Knowledge is a readable library with expandable content, status filters, draft editing, distinct publication and secondary archive/delete actions. Editing a published item clearly explains the return to Draft.
- Leads default to real customer inquiries. Test inquiries have a separate view. Contact details retain their customer-stated, unverified meaning; each inquiry links to its original conversation.
- Channels show actual Website Chat and managed Instagram state. Website setup separates approved origins and installation; snippet copying has a usable fallback.
- Auth, workspace selection, settings, empty, error and loading states share the new system. Product-facing error messages no longer expose local setup instructions.
- The public widget shares the palette, typography scale and message treatment. It supports Escape and focus return, preserves scroll position when earlier messages load, pauses polling in hidden tabs, and adds only new message nodes instead of rebuilding the live log on every poll.

## Reliability and scope

No database schema, RLS, membership check, secret handling, API request body or runtime authority changed. Website, Instagram and Test Agent still use the existing runtime. No unread counts, delivery/read receipts, SLA, agent confidence, CRM stages, or provider resend controls were introduced.

A successful human reply acknowledgement is separated from its following thread read. A failing read therefore cannot turn an already confirmed reply into a new send. Unconfirmed sends keep the same nonce and body. Late reads cannot roll back a newer conversation ownership version or newer delivery evidence. Overlapping history pages retain stable message ordering without duplicates.

## Validation

- Pinned dependency installation: passed, using pnpm 9.15.9 and the existing lockfile.
- Repository typecheck: passed.
- Repository lint and independence check: passed.
- Unit tests: 98 passed across 9 files, including 7 new Inbox race / filtering regressions.
- Public widget JavaScript: parsed and evaluated its no-embed exit successfully.
- Core text contrast: primary on white 6.36:1; muted text on white 5.16:1 and muted surface 4.64:1.
- Local API artifact build: passed.
- Local web production build: blocked by this container's missing `/proc` memory interface (`uv_resident_set_memory`, ENOENT), before compilation completes. No application configuration was changed to hide that environment failure.
- Local browser and disposable database acceptance: unavailable in this environment. The existing GitHub CI workflow runs a disposable Supabase stack and Playwright acceptance. Its scenarios were updated for the new mobile navigation, claim-first composer, customer/test separation, and acknowledged-send/read-failure regression.

The PR remains a draft while its CI and visual review are pending. No deployment or merge is part of this change.
