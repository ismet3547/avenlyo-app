# Product UI V1

Visual redesign of the independent application, based on merged Channels & Handoff main `ed945629cfe04b7097c6a94e8699603f2b9b5792`. The separate [landing page](https://github.com/ismet3547/landingpage) is a read-only brand reference. No code, dependency or feature is imported from it.

## Presentation boundary

Database/migrations/RLS, shared contracts, API routes, server actions, Auth, FrontOfficeRuntime, qualification, channel authority, transport, notifications and provisioning remain unchanged. Overview and the Inbox context use current-member RLS reads of existing data. The Inbox keeps its routes and ownership controls. A disabled local notification provider is displayed as “email not configured”; its persisted failed status is unchanged.

The widget retains its Shadow DOM, exact HTML contracts/data roles, requests, sessions, polling, textContent safety and idempotency. Its CSS is replaced, and a visual status attribute gives the existing paused state an amber banner. Removing those two presentation differences produces the original widget source byte-for-byte.

## Tokens and primitives

Semantic theme values live in `apps/web/app/globals.css`. The self-contained Shadow DOM widget uses the matching palette in its isolated `--av-*` variables; it does not load application styles.

| Token | Value |
| --- | --- |
| Page | `#fafaf7` |
| Ink | `#202622` |
| Muted text | `#646b64` |
| Primary / hover | `#264e3d` / `#1c3d2e` |
| Border | `#e3e5dd` |
| Muted surface | `#f2f4ed` |
| Card | `#ffffff` |
| Healthy / team surface | `#eef4e8` |
| Attention surface | `#faf6e9` |

Inter/system typography, restrained radii, thin borders and quiet status chips replace purple accents. Status is also expressed in text. Existing Button/Card/Input/Textarea primitives remain lightweight, joined by practical Brand, FormSection and ConversationItem components.

The main semantic text/surface pairs were checked against WCAG's 4.5:1 text threshold: body 14.75:1, muted text on muted surface 4.95:1, primary button 9.38:1, healthy 7.35:1, attention 5.45:1 and failure 6.18:1. User-entered headings, previews and contact values may wrap without widening the page.

## Screen work

- A 208px desktop sidebar groups Operations and Configure, with Settings/Test agent below. Mobile uses a native modal dialog with accessible naming, focus containment, Escape dismissal, return focus and existing navigation links. A skip link and reduced-motion treatment remain available.
- Overview presents real operational state, labeled metrics including test activity, recent real-channel conversations and a next action derived from existing state.
- Inbox uses list/thread/customer-context columns at wide sizes. Smaller screens retain the conversation first and stack context/controls below. Contact and lead data use existing RLS; staff notifications are secondary. Ownership, polling, retry and explicit resume behavior stay intact.
- Leads use responsive rows with contact, intent, qualification, source and activity. Test sessions and customer conversation history are visibly separate.
- Agent uses five readable sections with existing form values: objective, goals, radio-card communication style, contact fields and human assistance. The brief/structured-control authority boundary is unchanged.
- Knowledge uses real publication counts, clear draft/published states, compact library rows and Text/FAQ type cards. Channels use existing connection truth, compact origin configuration and an expandable copyable embed.
- Auth retains its split-screen flow with warm sage branding. The widget uses a compact dark-green launcher, neutral assistant bubbles, sage team replies and an amber paused banner.

## Verification

All existing Foundation and Channels assertions remain. Browser coverage adds actual-content screenshots and overflow checks for Overview, Inbox list/detail, Agent, Knowledge, Channels, Leads/detail, Conversations, Test Agent and Settings at 1440, 1280, 1024, 768 and 390px. It also verifies the new mobile drawer’s focus, Escape and navigation behavior.

Desktop captures include Auth, Overview, Inbox list/conversation, Agent, Knowledge, Channels and the widget. Mobile captures include Overview, Inbox, Agent, Channels and the widget, plus the other core screens. Use `pnpm test:browser` after a local production web build, as described in [local development](local-development.md). CI stores screenshots under its existing `foundation-browser-qa` artifact. Inspect the generated images rather than accepting skeleton/loading screenshots.

Validation on 2026-10-17 preserves all 91 unit tests, 161 pgTAP assertions, 41 Foundation acceptance assertions and 88 Channels acceptance assertions, including the populated Foundation upgrade. Both Chromium flows cover 55 core route/viewport combinations plus the existing customer/lead/handoff/replay assertions. Auth, menu, empty and active Overview, real Inbox, Agent, Knowledge, Leads, Channels and active/paused widget states are captured. Typecheck, lint/independence, production builds and API artifact smoke remain required CI gates.

No hosted database, live provider, legacy/landing repository write, merge or deployment is part of this milestone. No new product features are added.
