# Intercom interface reference

The frontend replaces the previous custom visual design with a close implementation of Intercom's product layout. The reference is the actual application UI shown on Intercom's official Inbox and Knowledge Hub pages:

- https://www.intercom.com/helpdesk/inbox
- https://www.intercom.com/helpdesk/knowledge-hub
- https://www.intercom.com/help/en/articles/6258745-the-inbox-explained

## Layout

A 56px neutral application rail switches products. The separate gray sidebar contains navigation for the current area. The white work surface uses compact headers, black primary buttons, fine dividers, system sans-serif typography, and light purple selection and message states. Decorative marketing panels, slogans, the previous theme and Manrope assets are removed. Avenlyo retains its own name and mark.

Inbox lays out the conversation list, thread and customer details side by side on desktop. Customer messages appear on the left; team and AI replies appear on the right. The test agent retains the customer's chat perspective. Tablets move customer details below the thread; phones show a single conversation and a modal navigation drawer. Data tables turn into readable records on narrow screens.

Overview presents persisted customer metrics, setup tasks, recent conversations, channel status and published knowledge counts. It does not fabricate activity or charts. Existing Auth, permissions, live updates, ownership, reply retries, knowledge management, collections, imports, test history and channel configuration remain connected to the real application actions.

Shared tokens and layout rules live in `apps/web/app/globals.css`; UI primitives are in `apps/web/components/ui.tsx`. Focus indicators, semantic controls, a skip link, modal focus containment, long content wrapping and reduced motion remain supported.

## Screenshots

Captured from the actual application during CI: [Inbox](design-preview/inbox-desktop.png), [Content](design-preview/knowledge-desktop.png), [Overview](design-preview/overview-desktop.png).

## Development preview

`pnpm dev:web` exposes `/preview` in development only, using labeled fictional fixtures with persistence and sending disabled. Production returns 404. This supplements real-data testing.

## Verification

Use `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm smoke:api`. The existing browser acceptance suite exercises real local Auth, workspace setup, all knowledge types and lifecycle operations, customer/test separation, channel handoff, ownership and human replies. Responsive coverage includes 1440, 1280, 1024, 768 and 390 pixels, with screenshots at 1440, 768 and 390. The full database/browser suite runs against a disposable Supabase stack in CI. Current screenshots are available in the successful run's `foundation-browser-qa` artifact.
