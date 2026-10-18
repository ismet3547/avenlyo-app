# Fresh application design

Rebuilds the application UI from `8bfc52f84c59a8ddee384553822531cf5a377617`. The new interface uses cool neutral surfaces, a restrained indigo accent, locally hosted Manrope, and shared semantic components. It is independent of previous visual implementations and design guides.

## Interface

- Overview summarizes real customer conversations, captured leads, qualified inquiries and paused conversations. Test activity is excluded. Setup progress is derived from persisted state; unavailable reads are never presented as completed setup.
- A consistent sidebar, workspace picker, mobile modal navigation, skip link and visible focus styles support all routes. Mobile onboarding puts setup ahead of empty operational sections.
- Inbox provides searchable conversation navigation, live thread updates, human ownership, personal replies, release and explicit AI resume. Customer context follows the thread. Ambiguous reply failures retain the original message ID for retry. Older messages remain loadable.
- Agent settings include instructions, tone, capabilities and contact fields, with a live configuration summary. Human assistance remains available.
- Knowledge supports all six business knowledge types, drafts, publishing, unpublishing, archiving, restoration and confirmed deletion. Search, status/type/collection filters, collection creation/renaming, webpage import and file import use the existing actions.
- Leads separates customer inquiries from test leads and links each detail to the appropriate conversation. Test Agent supports persisted history, published knowledge references, handoff, verified resume and new test sessions.
- Channels reuse the existing website and managed Instagram connections. Installation snippets use the widget’s existing `data-avenlyo-channel` contract. The standalone widget and backend runtime are unchanged.
- Auth, workspace selection, settings, loading, errors and missing-page states share the new typography and visual language.

Theme values are centralized in `apps/web/app/globals.css`; reusable primitives are in `apps/web/components/ui.tsx`. User-provided text wraps, small-screen tables become stacked records, and motion respects the OS preference. Manrope’s OFL license is included with its local font files.

## Local design preview

Run `pnpm dev:web`, then open `http://localhost:3001/preview`. This development-only route uses explicitly fictional data, never reads user data and disables persistence/sending. Use its navigation to inspect each screen. Add `?empty=1` for an empty overview. The route returns 404 in production.

## Validation

Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm smoke:api`. Browser acceptance remains in `apps/api/src/testing/browser` and follows the new labels and layouts while retaining real local Auth, publication, customer/test separation, ownership, handoff, widget and access-control checks. It captures the actual application at 1440, 1280, 1024, 768 and 390 pixels.

The design also has a backend-free development preview. It supplements rather than replaces the real-data browser acceptance flow. Full browser/database acceptance requires the disposable local Supabase stack, its fake providers and Chromium.
