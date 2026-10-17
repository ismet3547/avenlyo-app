# Product UI V2

V2 recomposes the working front office on the existing `feat/product-ui-v1` branch and draft PR #3, starting from V1 commit `8d10355355ef700ef5ce64e502d5297f338a3c30`. It retains the [V1 palette, accessibility and independent architecture](product-ui-v1.md).

## Product structure

- **Home** answers readiness, channel state, waiting work and useful inquiries. A compact typographic strip counts only Website Chat and Instagram conversations/leads. Test Agent data is excluded. Paused/attention conversations use the existing Inbox snapshot; recent conversations are presented as conversations, without inventing events.
- **Onboarding** derives four steps from existing saved Agent state, published knowledge, Test Agent conversation existence and Website Chat enablement. Unknown reads remain unavailable, never successful. No progress fields are stored.
- The **232px sidebar** has Home; Work (Inbox, Leads); AI front office (Agent, Knowledge, Channels); and Settings/Test agent below. Test conversation history remains at its original route, linked from Agent and Test Agent.
- **Inbox** is one continuous workspace. At 1280px and above it has 280px conversation navigation, a flexible thread and 280px customer context. At 1600px the outside panels become 300px. At 1024px it shows thread/context; on smaller screens the thread and actions/context flow through the page without an inner message scroll area. Desktop message scrolling keeps the composer stable.
- Conversation messages use sender labels, timestamps, a thin timeline rule and restrained team surfaces. The selected navigation row still derives from the same live thread snapshot. Existing ownership, send, retry, explicit resume and notification behavior is unchanged.
- **Agent** is an editor plus configuration summary. Capabilities are check rows; tone is a keyboard-accessible native radio group. The summary reflects current form values and is explicitly labeled a configuration preview, with saved knowledge/channel context. No model response is simulated or requested.
- **Knowledge** uses document rows, inline publication counts, underline filters and compact actions. Secondary archive/delete actions sit under More; deletion retains its existing confirmation.
- **Channels** uses connection rows and approved-site context, with management disclosed on demand. Initial Website setup is open; an existing enabled connection starts collapsed. Native disclosure state survives a form save, preserving visible feedback and keyboard context.
- **Leads** emphasizes customer, inquiry, source, qualification and contact. Detail has one primary Open conversation action and uses the existing source-dependent route.
- **Test Agent** uses the same conversation timeline, a quiet Test mode label and a useful outcome summary. The internal QA checklist is removed. The history list is explicitly Test conversations; existing real-channel detail URLs still lead to Inbox.
- **Widget V2** retains the existing Shadow DOM and all runtime JavaScript outside its static presentation markup. The launcher is compact with a small glyph; when open it is visually hidden, and closing restores its visibility and focus. Customer messages use a soft surface, assistant messages a quiet timeline and team messages sage. The paused banner remains amber.

## Presentation boundary

No schema, migrations, RLS, API/shared contracts, server actions, Auth/session behavior, FrontOfficeRuntime, qualification, handoff authority, provider/Instagram, notifications, delivery/idempotency or provisioning changes. Existing member-scoped reads are reused; Home adds channel filters and a bounded test-existence read, and Agent reads existing knowledge/channel state for its summary. No service-role key is introduced to web code. There are no dependency or lockfile changes, legacy/landing writes, merge, deployment or Pilot Go-Live work.

The numbered FormSection component, Home metric cards, Inbox card nesting, Knowledge summary cards, Leads table header and Test Agent QA cards are removed. Semantic status text replaces ordinary metadata badges; bordered surfaces are reserved for actual grouped objects and controls.

## Verification

Existing Foundation and Channels behavior assertions remain. Selectors change only for the recomposed Channels/history headings and Open conversation copy. Additional browser checks cover customer-only metrics with real Test Agent records, derived onboarding, live configuration summary, accessible history navigation, three-column Inbox bounds, mobile page scrolling, drawer keyboard behavior and widget close/return focus.

The existing CI pipeline runs typecheck, lint/independence, 91 unit tests, production builds, API artifact smoke, the populated Foundation upgrade, 161 pgTAP assertions, 41 Foundation acceptance assertions, 88 Channels acceptance assertions and both Chromium browser flows. The 55 core route/viewport checks at 1440, 1280, 1024, 768 and 390px remain.

Required captures include onboarding/active/attention Home, active/paused Inbox, Leads/detail, Agent, Knowledge, default/management Channels, Test Agent/history, Auth, active/paused widget and the mobile drawer. CI keeps them in the existing `foundation-browser-qa` artifact. Visual inspection checks hierarchy, primary actions, whitespace, wrapping, badge/border density and overflow. Firefox and Safari are outside the current Chromium automation.

For local setup and commands, use [local development](local-development.md).
