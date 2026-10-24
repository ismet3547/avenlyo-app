# Avenlyo frontend UX and workflow audit

Audit baseline: `ed945629cfe04b7097c6a94e8699603f2b9b5792` (24 October 2026). This report distinguishes source-confirmed defects from design recommendations. All requested routes, shared components, server actions, same-origin API handlers, shared schemas, API handoff logic, migrations, and existing tests were inspected before implementation.

## Priority findings

| ID / priority | Page / files | Confirmed behavior and user impact | Expected behavior / proposed solution | Scope |
| --- | --- | --- | --- | --- |
| F01 / High | Agent, Settings, Channels, new Knowledge; corresponding `actions.ts` and forms | Actions derive the destination from the current workspace cookie, while uncontrolled form values can belong to an earlier workspace or another tab. An owner of both workspaces can unintentionally write the wrong business's settings/content. RLS still enforces membership. | Bind each mutation to the rendered workspace, reject stale submissions with recovery guidance, and remount workspace UI after switching. | Frontend server actions; no DB change |
| F02 / High | `components/inbox-conversation.tsx` | A successful reply clears its nonce and text, then a failed GET enters the POST error handler. The composer becomes locked in retry with empty text and no original nonce. | Separate confirmed writes from refresh failures; retain the nonce only for unconfirmed writes and allow retry independently of current ownership. | Frontend |
| F03 / High | `components/inbox-conversation.tsx` | An older poll can replace newer ownership/AI state after a team action. Poll failures remain visible even after recovery. | Ignore superseded reads and older state versions, isolate live-update errors, offer refresh recovery, and clear errors on recovery. | Frontend |
| F04 / High | Test Agent page/actions | Resume ignores RPC errors and has no pending state; a failed resume appears to do nothing. Message and lead read failures become empty successful data. Invalid or inaccessible conversation URLs silently start a new test. | Report resume/read failures, prevent repeated resume, validate requested conversations, and recover explicitly. | Frontend server actions |
| F05 / High | Test Agent and saved conversation detail | `.order('created_at').limit(100)` loads the oldest 100 messages and silently omits recent context. | Show the latest page in chronological order with navigation to earlier saved messages; disclose partial history. | Frontend queries; existing API unchanged |
| F06 / Medium | Agent form | Unchecking contact collection while fields stay checked is rejected by the schema without a visible relationship. Setup brief wording implies runtime control although runtime deliberately excludes it. | Explain the brief as an internal note, connect goals and contact fields, and submit only supported selections. | Frontend |
| F07 / Medium | App layout / Sidebar | Mobile menu is not closed on navigation and has no Escape/outside dismissal. Header controls compete at 320px. Test Agent is marked as the Agent page rather than a distinct destination. | Accessible dismissible navigation, a clear Test Agent link, a wrapping mobile header, skip link and current workspace indication. | Frontend / design recommendation |
| F08 / Medium | Overview | Setup cards lack ordered progress; a first-item promotion remains even after publishing. Agent read errors appear as “Needs setup”. Activity is not linked to the destination. | Data-derived checklist with optional settings review, meaningful next actions, honest unavailable states and linked metrics. Do not require optional settings changes. | Frontend / design recommendation |
| F09 / Medium | Knowledge actions and editor | Publishing has no specific in-progress explanation; destructive removal lacks clear impact and cancel control. A saved item is lost among the listing. Filters do not expose their current state to assistive technology. | Explain publication processing, confirm removal/archive, identify the saved item, preserve filter/pagination context and expose active filters. | Frontend |
| F10 / Medium | Knowledge, Leads, Conversations | Listings silently stop at 100 records, with no route to older entries. Filtered empty states offer first-time onboarding instead of clearing the filter. | Scoped pagination, totals, clear-filter actions and channel filters where supported. | Frontend queries |
| F11 / Medium | Leads list/detail | Desktop-only 650px table requires horizontal scrolling on small screens; long summaries and contacts can overflow; “Needs info” gives no next step. | Mobile lead cards, wrapping text and contextual links to the original thread without inventing CRM actions. | Frontend |
| F12 / Medium | Inbox list/detail | Inbox list stays stale until navigation. Fetching earlier messages can overlap and loses scroll position. Resume has no confirmation of relinquishing a claim. | Visible refresh/poll feedback, guarded earlier loading with scroll preservation, and explicit resume confirmation. | Frontend |
| F13 / Medium | Channels | Clipboard failure is silent. Disconnect removes credentials without confirmation. Member permissions are not explained. Local demo remains available while disabled or when its origin is unapproved. | Manual copy fallback, disconnect confirmation, permission notice and accurate prerequisites for the demo. Explain that demo creates a real channel record. | Frontend |
| F14 / Medium | Workspaces | List query and switch failures are swallowed; selected workspace and switching progress are unclear. | Action-state feedback, current workspace marker, membership-checked switches and pending state. | Frontend server actions |
| F15 / Medium | Auth/callback and shared errors | Public UI exposes local infrastructure instructions; callback failure is silent; errors are generic with weak recovery. Auth pages have no visible primary heading on mobile. | Product-focused errors and retry/sign-in paths, callback notice and one main heading. Keep operator instructions in docs. | Frontend |
| F16 / Medium | Shared UI / all pages | Muted text is `#707587` on cool gray; several 10px labels are difficult to read. Long tokens can overflow flex/grid children; forms and links lack a consistent global focus treatment. | Darker secondary text, consistent focus/disabled states, 44px touch targets for controls, wrapping, readable labels and reduced-motion handling. | Frontend / design recommendation |

No source-confirmed Critical defect was found. The existing backend protects tenant membership, owner configuration, published-only knowledge, explicit AI resume, delivery semantics, test-channel isolation and durable idempotency. Those boundaries should be preserved.

## Route coverage

- `/auth/sign-in`, `/auth/sign-up`, `/auth/callback`: credential validation, confirmation, session verification and redirects.
- `/workspaces`, `/app`: creation, switching, selected membership, setup and activity.
- `/app/agent`: all supported goals, tone, contact fields, mandatory handoff and internal brief.
- `/app/knowledge`, `/app/knowledge/new`, `/app/knowledge/[id]`: Text/FAQ draft/edit/publication/archive/deletion and revision checks.
- `/app/test-agent`, `/app/conversations`, `/app/conversations/[id]`: durable test turns, same-key retries, saved history and explicit resume.
- `/app/leads`, `/app/leads/[id]`: qualification, customer-stated facts, channel and original thread.
- `/app/inbox`, `/app/inbox/[id]`: real threads, ownership, pause/claim/reply/release/resume, delivery ledger and polling.
- `/app/channels`, `/chat-demo`: exact origins, widget installation, managed Instagram and messaging-window constraints.
- `/app/settings`: business name, identity and read-only membership.

## Implementation and verification

Implementation groups and actual verification results are recorded in `frontend-ux-verification.md`. No schema migration, database reset, hosted database mutation, dependency upgrade or live customer/provider send is part of this change.
