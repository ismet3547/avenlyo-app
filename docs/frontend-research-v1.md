# Avenlyo frontend research and design direction v1

Research date: **17 October 2026**. Repository: `ismet3547/avenlyo-app`. Requested branch: `feat/frontend-recreation-v1`. Audited baseline: `ed945629cfe04b7097c6a94e8699603f2b9b5792`.

**Decision proposed: Direction B, “The Front Office.”** Build a warm, editorial workbench around real customer conversations and explicit AI-to-human control. Make operational truth the product's signature. This document is a proposal for approval, not an implemented redesign.

Scope is documentation only. No application, package, lockfile, database, API, runtime, RLS, or deployment changes belong to this session. The existing product is a functional constraint, never a visual reference. Product UI V1/V2, previous Avenlyo products, and the landing page were not used as design references.

Companion: [desktop and mobile text wireframes](frontend-wireframes-v1.md).

## 1. Current product functional map

### 1.1 Audit method and evidence

Inspected all web pages, shell, forms and server actions; shared schemas/types; the public widget script; Inbox BFF/API routes; relevant migration/RPC definitions; architecture, channels and security documentation; and both Playwright browser flows. This was a **source audit**, not an authenticated walkthrough or a new execution of acceptance tests. No configured local data or live provider behavior was assumed.

Key evidence locations, relative to repository root:

| Evidence | What it establishes |
| --- | --- |
| `apps/web/app/**/page.tsx`, `apps/web/components/*` | Routes, rendered fields, actions, responsive classes and UI states |
| `apps/web/lib/workspace.ts`, `proxy.ts`, `lib/api.ts` | Verified user, active membership, workspace preference and private request boundary |
| `packages/shared/src/schemas.ts`, `database.ts` | Exact goals, tone, contact fields, lengths, data types and real states |
| `apps/api/src/channels/routes.ts`, `widget.ts` | Real-thread pagination, delivery data, widget sessions, polling and retry behavior |
| `supabase/migrations/20261013221636_foundation_v1.sql` | Owner configuration, member reads, publication and lead semantics |
| `supabase/migrations/20261014211810_channels_handoff_v1.sql` | Atomic claim/release/resume, real-channel snapshot and delivery/notification ledgers |
| `apps/api/src/testing/browser/{foundation,channels}.spec.ts` | Accessible names, exact copy, URLs and mobile assumptions used by tests |
| `docs/{architecture,channels-handoff-v1,channels-handoff-security-review,instagram-managed-setup}.md` | Accepted architecture, deliberate provider limits and operating constraints |

### 1.2 Routes, jobs, data and actions

| Route / surface | Available information | Existing actions / limits |
| --- | --- | --- |
| `/` | No distinct product surface | Redirect to `/app` |
| `/auth/sign-up`, `/auth/sign-in` | Email/password and configuration/response state | Signup, confirmation message, password sign-in; 8–128 character password. No implemented social login, reset-password flow or SSO |
| `/auth/callback` | Supabase callback | Exchange callback code; fixed app destination |
| `/workspaces` | Member-visible workspace IDs/names | Create workspace with business name, switch workspace, sign out. Name 2–100 characters; no invitations/member management UI |
| `/app` | Published item count; all-channel conversation/qualified-lead/needs-human counts, including tests; settings brief/update time; enabled-channel count | Links to setup/test/knowledge/channels. Existing “configured” badge is a UI heuristic, not an activation state |
| `/app/inbox?page=n` | 50 real threads from `inbox_snapshot`: customer reference, channel, preview (180 characters), activity, AI mode, handoff state, assignee UUID, linked lead/qualification and delivery-attention boolean | Open thread; Previous/Next. Latest activity order, no global filters/search/read state in this RPC |
| `/app/inbox/[id]` | Real conversation; latest 100 messages and earlier-message cursor; linked lead **id/name/qualification only**; latest 100 deliveries; notification kind/status/error | Claim, owner-of-claim human reply, release, explicit resume; 4-second visible-tab polling. Thread lead payload has no email/phone/company/summary |
| `/app/leads?qualification=…`, `/app/leads/[id]` | Latest 100 leads, all sources; name/email/phone/company, summary, source, qualification, timestamps, linked conversation; status always `new` | Qualification filter, open detail, navigate to real or test conversation. No edit, pipeline, export, outreach or qualification override |
| `/app/agent` | Structured goals, tone, required contact selections, mandatory handoff, administrative setup brief | Owners save settings; members read. Four optional goals plus mandatory `human_handoff`; tone is professional/warm/concise |
| `/app/knowledge?status=…` | Latest 100 Text/FAQ items: title/content/type/status/updated time | Status filter; owner publish/unpublish/archive/delete; no website importer |
| `/app/knowledge/new`, `/app/knowledge/[id]` | Type, title/question, content/answer, existing revision | Owner save draft; edit makes published item draft. Title 3–180, content 3–6000 characters. Publish is a separate server operation |
| `/app/channels` | Website enabled flag, exact origins, public installation ID, last activity; Instagram enabled/status/account username and ID/verification | Owner save Website Chat, copy embed; local-only demo; owner disconnect Instagram. Connection/provisioning is operator-managed, not OAuth in UI |
| `/app/test-agent?conversation=…` | Test messages (up to 100), linked test-lead ID, paused state | New test, send/retry same message, resume test AI, view saved conversation. Only saved effective settings and published knowledge are used |
| `/app/conversations`, `/app/conversations/[id]` | Current list mixes test and real conversations, latest 100. Test detail has messages/timestamps and saved source-title references | Real detail redirects to Inbox; test detail can continue test. No real human-reply composer here |
| `/app/settings` | Business name, workspace ID, current role, creation time | Owner rename business; no billing, staff invitations, notification recipient selector or API-key settings |
| `/chat-demo?channel=…` | Fictional host site with installed real widget | Only available when configured API origin is HTTP local development; never present as a production preview service |
| `/api/agent/turn`, `/api/inbox/[id]` | Same-origin BFF boundaries | Must preserve verified-token forwarding, origin/body checks and private/no-store behavior |
| API-served `widget.js` | Business name, visitor-scoped messages and human-needed boolean | Anonymous session; send/retry, earlier messages, close/reopen, start new chat after unavailable session; 2.5-second open-widget polling |

### 1.3 Non-negotiable product truth

1. **Brief is not instructions.** `setup_brief` is excluded from runtime reads/prompts. Structured goals/tone/contact fields shape behavior. Knowledge supplies approved facts. Never suggest typing into the brief trains or changes the answering policy.
2. **Publication is authorization for answering.** Saving/editing knowledge makes a draft with no active embedding; publication is a distinct, revision-checked operation. Editing a published item temporarily removes that item from answering until republished.
3. **Human assistance is mandatory.** Explicit human requests, missing published facts and server-enforced conditions pause AI. Model advice cannot override server policy.
4. **Claim/reply/release do not resume AI.** Claim pauses and assigns the current member; claim also changes a linked lead's qualification to `needs_human`. Release removes the claim but leaves AI paused. Resume clears the claim and activates AI for the **next customer message**; it does not generate a reply to the backlog or requalify a lead automatically.
5. Only the claim owner can send a new human reply or release. Another active member's claim prevents claim/resume. Server checks remain authoritative; stale UI is never permission.
6. Website `available` means stored and available to the visitor. Instagram `sent` means provider accepted, not delivered/read. `unknown`, `failed`, `blocked` require attention. There is no resend-delivery action.
7. An unconfirmed browser reply retries the **same content and UUID**. This is different from retransmitting an already-created provider delivery. Freeze that submitted payload while its result is uncertain.
8. Leads are one per conversation, contain customer-stated facts, and are not verified identities. Test leads remain test data and never notify staff. No customer identity merging exists across channels.
9. Staff notifications are first real qualification / first human-assistance events, sent to a database-selected verified active owner. They are not an unread inbox, a configurable routing engine or guaranteed mailbox delivery.
10. Instagram supports customer-initiated **text** DMs, an existing 24-hour reply bound and a 1000 UTF-8-byte human-reply limit (also maximum 2000 characters). Managed setup/refresh only. No attachments, comments, cold outreach or self-service connect flow.

### 1.4 What cannot be truthfully displayed

No persistent unread/read markers, read receipts, typing/presence, SLA timers, agent confidence, AI quality score, response-time analytics, revenue, appointments, conversion rate, saved time, lead scores, pipeline stages, sentiment, custom tags, close/resolve/snooze, notes, attachments, drafts synchronized across devices, assignment picker, team names/photos, agent deployment versions or audit-event timeline. `profiles` contains ID/creation time, not staff names or avatars. Do not infer those fields from UUIDs.

Messages have source-reference JSON, useful for a source disclosure where valid; it is not a current knowledge revision guarantee or an explanation trace. Handoff fields expose current state/time, not a complete history or consistently structured reason. Do not invent historic system events or a reason such as “low confidence.”

### 1.5 Mobile and test contracts

Current mobile shell is a `<details>` menu below 768px; lists/cards stack, thread context stacks below messages, and Leads retains a horizontally scrollable 650px table. Existing automated coverage checks 390×844 overflow and some interaction visibility. It does not establish keyboard-safe composer behavior, drawer focus quality or all device/browser support.

Preserve form field names/IDs, action semantics, direct URLs, `role=status`/`role=alert`, and widget `data-role=customer|assistant|human`. Exact accessible text relied on by tests:

| Flow | Contract examples |
| --- | --- |
| Auth/workspace | Heading `Start with your business`; `Email`; `Password`; `Create account`; status contains `Check your email`; `Sign in`; `Business name`; `Create workspace`; Home heading `Your AI front office`; `Sign out` |
| Agent | `What should Avenlyo help your customers with?`; disabled checkbox matching `Human handoff`; `Save settings`; status `Agent settings saved` |
| Knowledge | `Title`, `Content`, FAQ radio `FAQ · question and answer`, `Question`, `Answer`, `Save draft`, exact `Draft`, `Publish`, status containing `Published.` |
| Test/lead | `Customer message`; exact `Send`; `View test lead →`; `View conversation`; `Continue test`; `Resume test AI`; exact paused sentence in current test page; source text `Test Agent` |
| Channels | `Approved website origins`; `Enable Website Chat`; `Save Website Chat`; `Disabled`, `Ready`, `Not configured`; `pre code` holding the embed; Channels heading `Meet customers where they are` |
| Inbox/widget | Heading `Inbox`; customer name remains in row link; `View linked lead →`; `Needs human · AI paused`; `Claim conversation`; `Claimed by you`; `Your human reply`; `Send human reply`; `Release conversation`; `Resume AI`; `AI active`; widget `Open business chat`, dialog `Business chat`, `Your message`, `Send` |

Design can change hierarchy while retaining these names. If a label needs to change in implementation, update the relevant browser assertions in the same future slice and continue testing the behavior. Do not silently substitute labels or add duplicate hidden text that makes role locators ambiguous. Keep exactly one status-announcement region per relevant operation.

## 2. Current UI problems

The rejected qualities in the brief—generic, flat, excessive uncomposed whitespace and admin-like settings—are stakeholder findings, not newly conducted usability research. Source inspection explains likely causes without treating the existing styling as a target:

| Structural issue | Evidence | Design consequence |
| --- | --- | --- |
| Every route shares one capped, padded document container | `app/app/layout.tsx` wraps everything in max 1240px | Inbox loses viewport height/width; list disappears when entering detail |
| Home repeats equal cards and totals | Three setup cards, three statistic cards, another callout | Setup and work compete; tests inflate operational impressions |
| Eight same-level destinations | Sidebar includes both Inbox and Conversations | Two labels appear to own the same job; testing is hard to place mentally |
| Different state dimensions share badge styling | AI pause, qualification, claim and delivery presented together | Users must read many badges before knowing who can reply |
| Configuration follows a stack of form cards | Agent has brief, goals, tone, contacts | The user sees fields before understanding the resulting behavior |
| Knowledge uses two-column content cards | 100-item list with controls repeated per card | Poor scanning and publication workflow under volume |
| Persistent oversized explanations | Sidebar promo, repeated page descriptions and ownership paragraph | Education continues to consume space during repeat use |
| Important handling state is detached | Ownership buttons in context card; composer elsewhere | Claim-to-reply path is physically and cognitively split |
| Generic loading/errors | Same three-card skeleton and local-setup error advice | Loading does not match the route; operational failure looks like installation troubleshooting |

These are design hypotheses to validate with owners, not proof of measured task failure. No screenshot comparison with old Avenlyo work was used.

## 3. Web research sources and evidence limits

### 3.1 How to read this research

All links below were investigated on the research date. **V** = official product screenshot visually inspected; **D** = public official documentation/release text retrieved; **I** = indexed official evidence only; **U** = not verified. None is a signed-in hands-on product trial. Full app interactions generally require accounts; no accounts or trials were created. A screenshot verifies composition, not live transitions, exact font names or responsive breakpoints.

The most recent anchors include Front's August 2026 inbox guide, Attio's May 2026 record redesign, Vercel's February 2026 navigation rollout and Help Scout's October 2026 sidebar release. Older design essays are labeled historical and used for reasoning, not claims about the latest entire product.

| ID / product | Official source | Evidence and extracted principle |
| --- | --- | --- |
| R01 Intercom | [Inbox explained][R01]; [customize Inbox][R02] | D; public guide dated September 2026 in browser. Collapsible panels and distinct chat/table views support different jobs. Article media did not reliably load; no live Inbox inspected |
| R03 Front | [new Inbox experience][R03] | D/V; edited August 28, 2026. Compact headers, restrained selection and navigation collapse reserve space for reading. Screenshot inspected; no live inbox or exact timings verified |
| R04 Linear | [Inbox][R04]; [redesign essay][R05] | D/V. Current docs confirm notification list/detail and keyboard movement. Essay/screenshots are from 2024: shared alignment and chrome hierarchy are historical design evidence |
| R06 Attio | [2026 record redesign][R06]; [record pages][R07] | D; media partially visible in release page, direct optimized image URL blocked by client. Consolidate identity/actions; keep attributes intentional; collapse low-value automated events. Not a screenshot-pixel reference |
| R08 HubSpot | [help desk setup][R08]; [manage tickets][R09] | D/I; split/table models and guided setup. Setup docs explicitly say Help Desk is not available in HubSpot's mobile app. Do not mistake broader CRM mobile support for help-desk parity |
| R10 Plain | [sidebar redesign][R10]; [Sidekick][R11] | D/V for 2024 sidebar; I for Sidekick. Thread details versus customer context is a deliberate separation. Historical screenshot, not proof of the full 2026 app |
| R12 Help Scout | [Conversation Sidebar][R12] | D/V; October 7, 2026. Group contextual facts near a conversation, with profiles available for deeper inspection. No authenticated composer behavior measured |
| R13 Crisp | [Inbox guide][R13]; [ordering][R14] | D/I. Status and recency can direct work; automated conversations need a comprehensible relationship with human work. Typing/presence capabilities described there are unavailable in Avenlyo |
| R15 Gorgias | [quick start][R15]; [views][R16] | D. Public guide describes view → list → thread/context and provides official screenshots/tour links. Ticket queues depend on real conditions, not decorative labels |
| R17 Vercel | [2026 navigation rollout][R17] | D/V. Current release moved horizontal navigation to a collapsible sidebar and documents mobile bottom navigation. Scope identity should remain stable across a workspace |
| R18 Stripe Dashboard | [Dashboard search][R18] | D/I. Search has resource context and explicit expanded results. Signed-in dashboard not inspected; no assertion about its current exact shell or fonts |
| R19 Supabase Studio | [tabs and editor updates][R19] | D/I; 2025 editor improvements. Tabs preserve object context, inspectors reveal detail. Useful information-system reference, not a reason to make Avenlyo a database editor |
| R20 Resend | [transactional email product][R20]; [log visibility][R21] | D/I. Make individual delivery states inspectable beside their object. Never translate acceptance into guaranteed delivery |
| R22 Railway | [Projects / canvas][R22] | D/V. Current docs, but the inspected canvas asset is older. Spatial service objects make infrastructure relationships understandable; their topology is not Avenlyo's model |
| R23 Clerk | [overview redesign][R23]; [command menu][R24] | D/I; 2025 releases. Commands can expose navigation/scope switching without expanding every menu. Growth charts work only when meaningful data exists |
| R25 Retool | [current App Builder][R25]; [classic frames][R26] | D. Current docs distinguish AI builder/preview from classic apps. Use explicit edit/preview boundaries; classic drawer/mobile guidance is labeled classic, not the new universal UI |
| R27 Sentry | [issue details][R27]; [new issue UI][R28] | D/I. Progressive evidence/context disclosure supports a focused diagnosis. Do not reproduce technical diagnostic density for business owners |
| R29 Notion | [current sidebar][R29]; [database views][R30] | D. Sidebar/Home changed substantially; the old Home URL now redirects. Context-preserving peeks are documented; do not assume old full-page Home screenshots remain current |
| R31 Coda | [row layouts][R31]; [mobile basics][R32] | D. One object can have a compact row and a full detail; mobile can promote that object to a full-screen view |
| R33 Arc | [Spaces][R33]; [focus / split view][R34] | D/I. Persistent context and reversible focus are useful native-browser ideas. No current live app, roadmap, maintenance status or mobile equivalence verified |
| R35 Raycast | [Action Panel][R35]; [interface essay][R36] | D/I. Selection determines available actions; default action must be unmistakable. Native product; not a web breakpoint reference |
| R37 Slack | [sidebar preferences][R37]; [mobile customization][R38] | D/I. Main destinations and within-destination navigation are different levels. Mobile navigation can be adapted rather than squeezed |
| R39 Airtable | [record detail][R39]; [mobile differences][R40] | D; updated August/September 2026. Detail and mobile support have explicit limitations. Field visibility is not authorization |
| R41 Granola | [AI-enhanced notes][R41]; [current product][R42] | D. AI enriches a familiar work object and exposes evidence; it need not dominate the shell as a chatbot. No live meeting or regeneration run inspected |
| R43 Cursor | [Agent mode][R43]; [diff review][R44] | D/I. Keep AI work reviewable in the work object. Review UI documentation spans versions; exact automatic-apply defaults are not assumed |
| R45 Notion Custom Agents | [Custom Agents][R45]; [testing guidance][R46] | D. Configuration, testing and activity are related surfaces. Avenlyo can borrow that relationship without adding triggers, tools, version history or generated instructions |
| R47 Dust | [agent development][R47]; [Sidekick announcement][R48] | I. Structured knowledge and a builder test surface were investigated. Direct Sidekick URL returned 404; do not use it as a verified visual reference |
| R49 Height | [public site attempted][R49] | U: direct fetch returned 502, no current official interface verified. Excluded from “current strong interface” conclusions; Linear supplies the project-tool category |

Additional primary references: [Carbon motion][M01], [Motion bundle guidance][M02], [WAI modal dialog pattern][M03], [Inter][T01], [Newsreader source/license][T02], [HTML dialog specification][M04]. Supabase changelog was consulted as read-only technical context; no upgrades are proposed.

### 3.2 Research synthesis

The recurring pattern is **a stable frame plus a work object**, with context selectively revealed. This fits Avenlyo because its durable object is a conversation, its useful output is a linked lead, and its most consequential action changes who can answer. Three principles follow as design inferences:

- Give reading and replying the largest continuous canvas. Avoid turning each message or contextual fact into an independent dashboard tile.
- Put current handling state beside the action it permits. Keep outcome quality, delivery and ownership as distinct labels.
- Reveal setup and reference detail at the moment it helps; maintain a direct route to every object and preserve the user's return context.

## 4. Comparative product matrix

### 4.1 Operational fit: 16 interfaces

Density is qualitative, not a measured pixel audit. Typography marked “sans” refers to visible screenshot character or documentation imagery; exact families are U unless explicitly sourced. “U” does not mean a product lacks a feature.

| Product / source | Navigation / density / typography evidence | Conversation and detail/context model | Primary actions / status | Mobile evidence | Strength for Avenlyo / weakness |
| --- | --- | --- | --- | --- | --- |
| Intercom R01–02 | Collapsible panels; compact operational; exact type U | Chat or table; customer apps/context | Conversation actions and separate state filters | Official iOS/Android described | Preserves context / too many capabilities and configuration layers |
| Front R03 | Icon rail + labeled navigation; compact; sans V | List beside reading area; compact header | Status sections, selection, contextual actions | U in inspected release | Reading space / email-oriented concepts exceed Avenlyo |
| Linear R04–05 | Grouped sidebar; dense; essay names Inter/Inter Display | Notification master-detail; object properties | Selection and action shortcuts | U in selected evidence | Strong hierarchy / technical density can intimidate owners |
| Attio R06–07 | Workspace/record context; compact or standard | Record facts on left; activity and comments | Identity + actions grouped; automatic events collapsed | App links present; behavior U | Lead-object clarity / CRM flexibility and enrichment unavailable |
| HubSpot R08–09 | Service workspace + views; exact type U | Split/table help desk; contextual record information | Tickets/actions with guided setup | Help Desk absent from mobile app per docs | Scoped work / enterprise menus and ticket model too broad |
| Plain R10–11 | Queues; exact full-shell density U; sans V in sidebar | Thread detail/customer tabs | Context-selective tools and status | U | Selective context / developer metadata and integrations overfit |
| Help Scout R12 | Full shell U; modular sidebar; sans V | Conversation with contextual overview/profiles | Status and assignment in context | Product mobile offered; behavior U here | Human-friendly facts / avoid sparse empty modules |
| Crisp R13–14 | Inbox queues; density/type U | Channel conversation + human/AI surfaces | Status-first or recent ordering | U in inspected guide | Clear automation/human boundary / automatic reactivation differs from explicit resume |
| Gorgias R15–16 | Contextual sidebar → views → ticket list | Thread + right metadata/customer/apps | Header actions; composer bottom | U | Fast scanning / ecommerce context and ticket actions unavailable |
| Vercel R17 | 2026 collapsible sidebar; compact sans V | Object detail rather than conversation | Workflow-ordered navigation | Floating bottom bar documented | Workspace scope / deployment data is not owner-facing work |
| Stripe R18 | Current complete shell/type U | Search resource groups → detail | Explicit results expansion | U | Precise labels / global search backend cannot be assumed |
| Resend R20–21 | Log/list inspection documented; full shell U | Per-email events and logs | Object-specific delivery state | U | Acceptance truth / raw provider diagnostics too technical |
| Notion R29–30 | Current customizable sidebar tabs | Database peeks/full page; content hierarchy | Object-context actions | U in chosen docs | Reversible detail / excessive customization harms predictability |
| Coda R31–32 | Document + view; exact type U | Row → side/center/fullscreen detail | Object-specific row layouts | Cards → full detail documented | Responsive object continuity / builder controls do not belong in daily UI |
| Airtable R39–40 | Interface pages + record layouts | Review/list with record detail | Scoped buttons, field groups | Explicit parity matrix | Define limits / broad schema freedom is irrelevant |
| Granola R41–42 | Notes are work surface; exact type U | Human notes + enhanced content/evidence | AI within artifact | Mobile capture described | AI feels useful without spectacle / Avenlyo has no note enhancement |

### 4.2 Inspection across the 26 requested dimensions

To avoid inventing behavior, the observation checklist is explicit. Codes: **S** shell/navigation/page hierarchy/density (1–4); **E** empty and loading states (5,14); **W** tables/lists, detail, conversations, side panels (6–9); **A** forms, status, primary action (10–11,26); **K** search/command/mobile (12–13); **M** transitions/micro-interactions/motion (15–17); **V** type/spacing/color/borders/radius/shadow/icons/information hierarchy (18–25). All recommendations later are Avenlyo specifications, not unverified observations of these products.

| Useful reference | S / E | W / A | K / M | V and transferable decision |
| --- | --- | --- | --- | --- |
| Intercom | D panel/layout options; E U | D table/chat, context, status actions; forms U | D command/mobile; exact motion U | Exact styling U from unloaded media; adopt adaptable context, not its entire shell |
| Front | V compact nav/list; E U | V scan rows/selection; D compact header; forms U | D search in sidebar; mobile/M U | V muted lavender navigation, fine rules, rounded selected row, outline icons, little elevation; borrow compositional restraint, choose own palette |
| Linear | V aligned sidebar/list; E U | V continuous object/detail, narrow property areas; D shortcuts | D keyboard navigation; animation timings U | V low-contrast chrome with stronger content; essay documents typography; use alignment and hierarchy rather than decorative cards |
| Attio | D identity/actions hierarchy; E U | D attributes, lists, comments; forms U | D attribute search; mobile/M U | Precise spacing/shadows/radii U; use intentional fact groups, no copied dimensions |
| HubSpot | D guided setup and views; E U | D split/table context; ticket forms/actions D | Mobile limitation D; M U | Exact visual tokens U; use setup guidance, reject broad ticket taxonomy |
| Plain | Full shell/E U; V sidebar | V detail/customer switch and fact rows; form behavior U | D shortcuts for context; mobile/M U | V gray segmented switch, restrained shadow/radius, thin separators, compact labels; use context grouping |
| Help Scout | Full shell/E U; V contextual modules | V hierarchy of status, identity and details; forms U | Mobile interaction/M U | V readable sans, white modules, muted labels, small icon accents; keep facts readable without adding empty modules |
| Crisp | D ordering; E U | D conversation/status model; form geometry U | Search/mobile timing U | Styling U; carry explicit AI/human boundary, never import automatic resume semantics |
| Gorgias | D view/list/detail hierarchy; E U | D chronology, context, composer/header actions | Search D; mobile/M U | Screenshot metadata confirms layout; exact tokens U; borrow list-to-thread continuity |
| Vercel | V sidebar/object header; E U | V object sections; conversation N/A; forms U | D mobile bottom bar; M U | V neutral grayscale, flat separators, compact outlined icons and rounded controls; maintain scope with less chrome |
| Resend | D object/log hierarchy; E U | D inspectable per-message events; exact forms U | Mobile/M U | Exact tokens U; make delivery explanation accessible on its message |
| Notion | D sidebar tabs/hierarchy; E U | D peeks/views; conversation-specific details U | D search; exact M/mobile U | Exact current visual tokens U; keep reversible context, avoid copying older screenshots |

No timing values below are claimed to have been measured from SaaS videos. Unknowns should be validated in future prototypes rather than filled with plausible descriptions.

## 5. Interaction and motion research

Carbon distinguishes motion that helps work from expressive moments, supplies 70/110/150/240ms tokens for short feedback/expansion, and publishes separate entrance, standard and exit curves [M01]. Use this as a documented baseline, not a mandate to animate each element. WAI's dialog pattern establishes focus containment, Escape dismissal and focus restoration [M03]; browser dialog behavior is defined by the HTML standard [M04].

| Interaction question | Design inference for Avenlyo | Why |
| --- | --- | --- |
| Page transition | Instant frame/nav update; optional 110ms content fade; no sliding entire pages | Navigation should not make an operator wait |
| Selecting a conversation | Selection immediately changes; old content/composer clears immediately; cached content instant, otherwise thread skeleton | Never show the old customer's composer under a new name |
| Context panel | 240ms entrance; reveal only on deliberate request below wide desktop | Motion explains where context came from |
| Hover/selection | 110ms surface color on hover; selection state itself immediate | Selection communicates current object, not a spectacle |
| Message arrival | 150ms opacity + 4px rise only for newly persisted messages | Enough change to notice; history loads without stagger |
| Loading | Skeleton only after 150ms; keep dimensions; static shapes by default | Avoid flashing placeholders and false impressions of activity |
| Optimism | Local form choices, row selection, panel state and copy feedback can update immediately | Reversible local state is safe to present immediately |
| Server mutations | Claim, resume, send, publish, disconnect and save show pending until confirmed | False success would undermine ownership/publication truth |
| Command menu | 150ms opacity/4px entrance; keyboard-first; commands navigate only in v1 | Avoid implying searchable customer data or unrestricted actions |
| Onboarding | Completion mark appears after data confirms; optional 110ms color fade | No progress theatrics or persisted “done” invented from clicks |
| AI pause/resume | Text/icon changes after server confirmation, no morphing avatars or pulsing rings | The state is consequential and must remain legible |

Exact proposed values, exceptions, easing and reduced-motion rules are in section 14.

## 6. Recommended UX model and information architecture

**Avenlyo is the front office a business can supervise:** approved answers, useful inquiries and a clear path to a person. Within five seconds the owner should understand (a) this is the current business, (b) where real customer work lives, and (c) who is answering the selected conversation.

Most important screen: **Inbox conversation**, where trust becomes action. Second: **Home**, a short operational brief connecting readiness to work. Knowledge is the most important setup dependency; it should remain one primary click away.

### 6.1 Primary navigation and route continuity

| Level | Visible destination | Route strategy | Reason |
| --- | --- | --- | --- |
| Main | Home | `/app` | Readiness and real handoff work |
| Main | Inbox | `/app/inbox`, `/app/inbox/[id]` | Real customers only |
| Main | Leads | Existing lead routes | Evidence-backed inquiry directory |
| Setup group | Agent | `/app/agent` | Shape supported behavior |
| Setup group | Knowledge | Existing knowledge routes | Control approved facts |
| Setup group | Channels | `/app/channels` | Make the configured business available |
| Agent secondary tabs | Behavior · Test Agent · Test history | Existing `/app/agent`, `/app/test-agent`, `/app/conversations` routes | Test work is visibly separated without adding another main destination |
| Footer | Settings | `/app/settings` | Workspace essentials |
| Workspace menu | Current workspace · switch/manage · sign out | Existing switch action and `/workspaces` | Scope stays continuously visible |

No primary Conversations, Reports, Analytics, Notifications, Automations, CRM or Integrations destination. Do not make Test Agent a persistent promotional card. Agent's Test tab and a quiet “Test agent” header action are sufficient. Keep all existing deep links valid; test history filters existing conversations to `channel=test_agent`. Existing real `/app/conversations/[id]` links keep redirecting to Inbox.

Desktop main navigation is persistent and labeled. Mobile uses Home, Inbox, Leads and Menu along the bottom; the Menu sheet exposes Agent/Knowledge/Channels/Settings and workspace controls. Inside an open thread, bottom navigation yields to the composer; Back returns to the preserved Inbox list, and a header Menu remains available.

### 6.2 Relationships and truth

- Leads are a **view of useful conversations**, not a separate sales workflow. Detail always links to the source conversation. Default Leads shows real sources; an explicit Test leads scope exposes existing test records. Test-origin detail is unmistakably labeled.
- Knowledge is a peer of Agent because it is a substantial publication workflow. Agent links to “Published knowledge,” never embeds all content as agent instructions.
- Channels is the final business setup surface. Website exact-origin installation and managed Instagram state are different tasks and should not use interchangeable Connect buttons.
- Home is a **brief**, not a chart dashboard or generic activity feed. Its content derives from current rows; no generated executive summary is needed.
- AI status answers “Will automation answer the next customer message?” Ownership answers “Who may send a human reply?” Qualification answers “What inquiry facts have been captured?” Delivery answers “What happened to this particular outbound message?”

### 6.3 Navigation and search limits

V1 optional command menu is **“Go to…”**, containing only existing destinations and permitted creation routes. Do not label it “Search everything.” No customer search backend exists. Do not fabricate Inbox tabs that filter only one 50-row page while claiming workspace-wide results. Ship the current recent list and truthful pagination first. Global queue/filter read composition is a separate future design/engineering decision, not a hidden requirement of this proposal.

## 7. Three distinct design directions

### A. Dispatch — an operator's instrument

**Philosophy:** maximize throughput for people handling conversations all day. Character: graphite frame, cool surfaces, compact type, sparse electric-lime action accents. The interface feels like an instrument with clear operational channels.

| Surface/system | Direction A |
| --- | --- |
| Shell/navigation | 64px icon rail + 176px section navigator, collapsible independently; Inbox first, dense command shortcuts |
| Home | Full-width operational list of paused real conversations, compact readiness strip above it |
| Inbox | Persistent three work panes on large desktop: 288px list, message canvas, 248px context; almost no page padding |
| Agent | Compact policy matrix: goal/behavior/collection requirement columns; test adjacent via explicit saved-state boundary |
| Knowledge | 40px rows, status/type/date columns; full-height editor side pane |
| Channels | Technical connection registry with state, origin/account detail and row-level configuration |
| Leads | Dense grid; selected inquiry opens side inspector linking its conversation |
| Widget | Compact messenger, charcoal header, lime send action; channel utility rather than hospitality |
| Type/color | Inter 13/18 working text; 18px compact headings; #171B22 frame, #F3F5F7 canvas, #C6F36A accent with dark text |
| Borders/radius/icons | 1px separators; 4px control radius/8px overlays; 16px Lucide outline icons |
| Motion/density | Very dense; 70–110ms feedback, 150ms panels; minimal positional motion |
| Mobile | Single full-screen work object; header menu and large composer targets replace desktop density |
| Strengths | Strong repeat-use scanning, technical confidence, clear high-volume intent |
| Risks | Too much early-stage chrome; can feel like another support admin tool; dark/lime treatment may reduce owner approachability |

### B. The Front Office — a composed business workbench

**Philosophy:** make a small business feel in control of an attentive front office. Character: warm mineral canvas, paper-white work surfaces, ink text, cobalt decisions and editorial page introductions. Medium density where people scan; comfortable measure where people read.

| Surface/system | Direction B |
| --- | --- |
| Shell/navigation | Single 208px labeled sand sidebar; small wordmark, business switcher, six destinations in two groups; footer Settings. Content gets one continuous working plane |
| Home | “Your AI front office” brief: real handoff queue in main column, narrow setup/readiness ledger alongside; no KPI card grid |
| Inbox | Two work panes by default: 320px list + flexible white conversation canvas. Optional 280px context pane at ≥1440px; drawer below that |
| Agent | “How your front office works” behavior brief: numbered outcome, voice, collection and human-support sections; deterministic effective-behavior summary alongside |
| Knowledge | Library-like rows with title, excerpt, type and publication state; editor is a document, publication is an explicit action |
| Channels | Two honest connection rows; select Website to open installation sections; Instagram explains managed state without a false OAuth CTA |
| Leads | Quiet inquiry ledger, 60px rows, no repeated `New` column; source conversation is the main next action |
| Widget | Hospitality-led: business name, white conversation, short honest AI disclosure, cobalt customer/send accent, explicit team reply labels |
| Type/color | Inter for working UI; Newsreader for selected 30/36px page titles only; #F5F3EE canvas, #EEEAE2 sidebar, #FFFFFF work, #1E2932 ink, #2455D6 cobalt |
| Borders/radius/icons | Borders define pane edges, input affordances and row groups; no card around every fact. 6px controls, 10px overlays, 16px widget; 18px restrained Lucide icons |
| Motion/density | Medium: 88px conversation rows, 48–60px data rows, 14px working text/15px messages. 110ms feedback, 150ms new messages, 240ms context panels |
| Mobile | Route-based full-screen list/detail, not squeezed panes; 44px controls, keyboard-safe composer, Menu sheet |
| Strengths | Premium through composition and type; understandable to owners; warm without obscuring work; distinctive from developer consoles |
| Risks | Editorial headings can become decoration if repeated inside tools; warm neutrals require verified contrast; resist adding framed modules to fill space |

### C. Signal — an AI workflow command center

**Philosophy:** make the AI operating model visible as the product's main organizing idea. Character: cool near-white, deep midnight masthead, large state surfaces and a horizontal work journey. It is a control room for one front-office agent.

| Surface/system | Direction C |
| --- | --- |
| Shell/navigation | 64px top navigation: Work · Agent · Sources · Channels. Work secondary tabs Home/Inbox/Leads; workspace scope in masthead |
| Home | Three conceptual lanes: approved information, answering channels, human intervention; each points to existing data/actions, no invented job graph |
| Inbox | Wide selected thread as dominant object; compact slide-out conversation navigator and persistent state bar; list does not always remain visible |
| Agent | Large sequential behavior canvas: Answer → Recognize interest → Collect → Hand over. These are structured settings, never a drag/drop workflow engine |
| Knowledge | Source register attached to the answering stage; strong published/draft contrast |
| Channels | Connection endpoints represented as distinct large state sections with configuration drawers |
| Leads | Outcome stream with one inquiry per row; details open full-width to emphasize evidence |
| Widget | AI-forward introduction and clear transition to Team; midnight header, restrained cyan accents |
| Type/color | Inter 14px body, 28px sans headings; #F5F8FC canvas, #101D35 masthead, #006C87 accent, #D9F3F7 selection |
| Borders/radius/icons | Broad surface bands, 12px controls/20px panels, bolder state icons; no fine-rule editorial ledger |
| Motion/density | Spacious state composition; 150ms feedback and 240ms stage/context changes, no continuously animated paths |
| Mobile | Horizontal hierarchy becomes Work tabs + Menu; stage editor becomes a linear sequence |
| Strengths | Strong AI product identity; compelling setup story; easy to explain one agent across channels |
| Risks | Can imply routing, execution traces and workflow capabilities that do not exist; extra navigation to switch threads; spatial Home may feel empty with little data |

## 8. Recommended direction: B, The Front Office

Choose B as a whole. Do not combine Dispatch's dual rail, Signal's stage canvas and B's typography. The unifying form is the **continuous workbench with a concise business brief**.

| Criterion | A | B | C | Reason B wins for this product |
| --- | --- | --- | --- | --- |
| First paying customers | Strong for trained operators | **Best** | Strong for demos | Owners can configure, check and intervene without learning ticket operations |
| Perceived quality | Efficient but familiar | **Best** | Visually striking | Controlled composition, readable work and restrained detail signal care |
| Trust | Strong state visibility | **Best** | Risk of excessive AI signaling | B makes published facts and human control tangible |
| Operational clarity | **Best at high volume** | Strong | Weaker thread switching | B fits the small pilot while keeping a scalable master-detail pattern |
| AI differentiation | Subtle | **Concrete** | Strong but risky | The differentiator is explicit supervision, not animated AI theater |
| Scalability | Strong | **Strong** | Constrained by conceptual lanes | Lists and context can grow without introducing a second navigation system |
| Distinctiveness | Developer-console family | **Distinct business character** | AI-control-room family | Warm paper/ink and limited editorial type establish a recognizable identity |

These are design judgments, not measured competitive scores. B's premium quality must come from consistent type, alignment, high-quality state handling and responsive composition. Large empty hero areas, decorative gradients and card proliferation would defeat it.

## 9. Page-by-page experience specification

The following are **proposed screens**, using existing capabilities. A configuration sheet or secondary tab may be a frontend presentation of an existing route/action; it does not imply a new backend endpoint. All mutation states remain server-confirmed. Shared conventions: preserve typed input on recoverable failure; distinguish loading from empty; show role restrictions before interaction; expose Retry without a page reload where the existing action permits it. Errors should explain the failed user task, not expose database/provider internals.

### 9.1 Auth

| Field | Specification |
| --- | --- |
| Purpose | Let a business owner establish or return to their account |
| Primary user question | “How do I enter my workspace?” |
| Layout | Sand page; 400px white form area integrated into the page, no floating shadow card. Small Avenlyo wordmark above; narrow brand statement at ≥1024px, form remains the focus |
| Hierarchy | Sign-in/signup title → email → password → response → full-width submit → alternate auth route |
| Primary action | `Sign in` / `Create account` |
| Secondary actions | Switch sign-in/signup; confirmation instructions after signup |
| Empty state | Untouched form with real labels and email/password autofill; no demo credentials |
| Loading state | Button label changes and disables duplicate submit; preserve field geometry |
| Error state | One form-level response with task-specific wording; invalid inputs retain values. Unconfigured environment uses existing disabled state, not a fake login |
| Mobile behavior | Single column, 24px gutters, ≥16px input text; no decorative second panel |
| Motion / micro-interactions | 110ms focus/hover; no page entrance animation or password-field movement |
| What must not appear | Google/Apple/SSO login, password reset link without a flow, testimonial metrics, account verification guarantees |

Preserve the tested signup heading `Start with your business`. Local confirmation-mail addresses belong only to development-context copy; do not hard-code them into a future production-facing instruction.

### 9.2 First workspace / onboarding

| Field | Specification |
| --- | --- |
| Purpose | Establish the business scope, then guide available setup tasks |
| Primary user question | “What do I need to do before a customer asks a question?” |
| Layout | `/workspaces`: 480px main column; existing workspace list above create form. After creation, Home's readiness ledger supplies the setup path |
| Hierarchy | Business name → Create workspace → post-create Agent / Knowledge / Test / Channels links |
| Primary action | `Create workspace`; on Home, next actionable setup task |
| Secondary actions | Open existing workspace, sign out; skip testing/setup steps by using navigation |
| Empty state | Explain that a website is optional; only business name is required |
| Loading state | `Creating…`; disable only submission, preserve name |
| Error state | Inline create failure and retry; workspace-load failure distinct from no workspaces |
| Mobile behavior | Full-width form; workspace rows 52px minimum; setup tasks become a vertical ledger |
| Motion / micro-interactions | Route transition immediate; completed task icon fades 110ms after confirming data |
| What must not appear | Industry survey, staff invitation, logo upload, automatic website ingestion, persisted onboarding score or mandatory test gate |

Testing is a recommended action, not a completion checkbox: the database does not record a durable “passed test.” A settings update indicates saved settings, not customer readiness. See section 11 for exact derivations.

### 9.3 Home

| Field | Specification |
| --- | --- |
| Purpose | Give the owner a short brief on real work and answering readiness |
| Primary user question | “Does someone need me, and is my front office prepared?” |
| Layout | Max 1120px; title and workspace context, then 2:1 columns. Main: paused real conversations (max five). Right: published knowledge and channel facts. Recent real conversations below only when useful |
| Hierarchy | Human work first when present → readiness gaps → recent real work; if no channel exists, readiness occupies the main emphasis |
| Primary action | Open the first shown paused conversation; when none and setup is incomplete, act on the next setup dependency; otherwise `Open Inbox` |
| Secondary actions | Agent, Knowledge, Channels; quiet `Test agent` |
| Empty state | “No customer conversations yet” with setup/channel guidance, not a success claim |
| Loading state | Heading stable; five row skeletons and three readiness lines; delay placeholder 150ms |
| Error state | Failed section reports unavailable; other successful sections remain. Counts never turn failure into zero |
| Mobile behavior | Human work → readiness → recent; 20px gutter; no horizontal statistics strip |
| Motion / micro-interactions | 110ms row hover; no animated counters, charts or staggered cards |
| What must not appear | Mixed test/live totals, revenue, AI resolution percentage, time saved, readiness score, fictitious “all caught up” when fetch fails |

### 9.4 Inbox list

| Field | Specification |
| --- | --- |
| Purpose | Navigate real customer threads without losing the work surface |
| Primary user question | “Which conversation should I open?” |
| Layout | 320px master pane next to thread at ≥1024px; 56px pane heading, 88px row target, pagination footer. At narrower widths it is a full-screen list |
| Hierarchy | Customer/name or safe channel reference → latest preview → AI/claim state; channel and activity are supporting facts. Delivery issue adds a small explicit attention line |
| Primary action | Open thread; row is one semantic link |
| Secondary actions | Previous/Next 50; explicit Refresh; Channels link in empty state |
| Empty state | Real messages will appear after a channel receives them; link to Channels |
| Loading state | Preserve current list during refresh with visible refreshing label; initial six row skeletons |
| Error state | Keep stale list with “Could not refresh” and Retry; if initial load fails show no zero-state |
| Mobile behavior | 100% width; two-line preview; tap opens route-based detail with Back to same page/scroll position |
| Motion / micro-interactions | Hover 110ms; selected row immediate, tint + 2px left rule. Preserve selected row position while the operator is composing; explicit refresh can reorder |
| What must not appear | Unread dots/counts, priority scores, SLA aging, Resolve/Snooze, new outbound conversation, global search, misleading current-page filters |

Use `updatedAt` as **activity**, not “waiting since.” Preview may be a customer, AI or human message; the snapshot provides no preview author. Do not prepend a guessed sender.

### 9.5 Inbox conversation

| Field | Specification |
| --- | --- |
| Purpose | Read the full exchange and deliberately manage human intervention |
| Primary user question | “Who is answering, and what can I do now?” |
| Layout | Fixed 64px identity header + state/action strip; flexible scroll timeline; composer at bottom; optional contextual facts pane. No shared page max-width or large hero title |
| Hierarchy | Customer and channel → AI state + ownership → messages → allowed action. Delivery errors stay attached to messages; staff email stays in context |
| Primary action | Unclaimed: `Claim conversation`; claimed by you: `Send human reply`; claimed by another: read only. Resume is an explicit separate action |
| Secondary actions | View linked lead, Load earlier messages, context disclosure, Release conversation, Resume AI as permitted |
| Empty state | “Waiting for the first customer message”; no invented greeting in timeline |
| Loading state | Identity loading and inert composer; never retain previous thread's content while a new ID loads |
| Error state | Thread failure offers Retry; polling failure adds a stale warning. Mutation conflict preserves content and refreshes state; uncertain send freezes same payload for safe retry |
| Mobile behavior | Full-screen thread with Back/context/Menu header; sticky state summary; bottom composer respects `dvh`, safe areas and keyboard; context opens full-height sheet |
| Motion / micro-interactions | Newly persisted messages 150ms; keep scroll when reading earlier history; focus claim-success composer only on the operator's click, never during polling |
| What must not appear | Fake named staff/avatar, read receipts, typing indicator, generated handoff reason, historical ownership events, “delivered” for provider acceptance, retry-delivery button |

See section 10 for the action/state matrix, exact messages and layout thresholds.

### 9.6 Leads list

| Field | Specification |
| --- | --- |
| Purpose | Review captured service inquiries and open their evidence |
| Primary user question | “Who expressed useful interest, and what do we know?” |
| Layout | Full-width quiet table: Contact, Inquiry excerpt, Qualification, Source, Updated. 60px minimum rows; no per-row card. Real/Test scope above existing qualification filters |
| Hierarchy | Contact name/company/fallback → contact detail → short summary; qualification and source remain textual |
| Primary action | Open lead detail |
| Secondary actions | Existing qualification filters; explicit Test leads scope; link to Inbox |
| Empty state | Real scope: “Customer inquiries will appear here.” Explain service interest and stated contact evidence; test scope can link to Test Agent |
| Loading state | Table-shaped rows with stable column widths |
| Error state | Inline list failure with Retry; no empty-state substitution |
| Mobile behavior | Convert each row to a 3-line ledger entry: contact, summary, qualification/source/update; no page-level horizontal scrolling |
| Motion / micro-interactions | 110ms row hover; detail opens as normal route; no animated sorting |
| What must not appear | Kanban, deal values, scores, editable stages, outbound email button, bulk actions, repeated `New` status column |

Scope filtering can use the existing member-scoped leads read with `source=test_agent` or non-test sources. Preserve the 100-record cap visibly; do not label a limited list as an exhaustive CRM.

### 9.7 Lead detail

| Field | Specification |
| --- | --- |
| Purpose | Inspect customer-stated facts beside the inquiry and source |
| Primary user question | “What did this person ask for, and where is the original conversation?” |
| Layout | Max 960px; name + source, wide summary section and 280px contact facts. A document-like layout with one section rule, not two floating cards |
| Hierarchy | Inquiry summary → qualification/source → name/email/phone/company → source conversation link |
| Primary action | `View conversation` routes to real Inbox or test history by source |
| Secondary actions | Back to preserved Leads scope/filter |
| Empty state | Missing contact fields read “Not provided”; missing whole record uses unavailable/not-found flow |
| Loading state | Stable title/fact slots, no fabricated contact values |
| Error state | Access/missing record gives a neutral unavailable page; recoverable data failure offers retry without revealing other workspaces |
| Mobile behavior | Summary above contact facts; conversation action visible near top; no nested side drawer |
| Motion / micro-interactions | 110ms link feedback; contact text selectable; route transition immediate |
| What must not appear | Verified identity checkmark, enrichment, edit form, automatic follow-up, qualification explanation not supported by stored evidence |

Keep `Test Agent` visible on test-origin records. “Qualified” means the existing server qualification, not a sales recommendation.

### 9.8 Agent

| Field | Specification |
| --- | --- |
| Purpose | Shape supported front-office behavior through a readable operating brief |
| Primary user question | “How will Avenlyo help, what will it collect, and when will a person take over?” |
| Layout | Max 1040px; Behavior/Test Agent/Test history tabs. 640px editor + 280px deterministic summary; numbered sections rather than repeated cards |
| Hierarchy | Supported outcomes → tone → requested contact fields → mandatory handoff → optional planning note. Save bar sits directly after content and sticks when needed |
| Primary action | `Save settings` |
| Secondary actions | Test agent using saved configuration; open Knowledge; Reset local edits to last saved values |
| Empty state | Defaults are real settings; do not show an unconfigured blank agent persona |
| Loading state | Section-shaped skeleton; no editable values until loaded |
| Error state | Inline schema issue near relevant choice plus one response region; preserve all edits and saved-state distinction |
| Mobile behavior | Single column; summary is a collapsible “Effective behavior” section; sticky save does not cover fields |
| Motion / micro-interactions | Local selections instant; summary text changes without simulated typing; saved confirmation after server response |
| What must not appear | Raw prompt, agent name/avatar setup, model picker, tool permissions, invented workflow graph, live unsaved test preview |

### 9.9 Knowledge

| Field | Specification |
| --- | --- |
| Purpose | Manage the business facts approved for answers |
| Primary user question | “What can my agent use today?” |
| Layout | Max 1120px; published/draft/archived/all filters, owner Add knowledge action, list rows with 2-line title/excerpt, type/status/update and disclosure actions |
| Hierarchy | Title → excerpt → publication state; type icon is secondary. Publication actions stay attached to their item |
| Primary action | `Add knowledge`; draft row has `Publish` as contextual action |
| Secondary actions | Edit item, Unpublish, Archive, Confirm delete; status filtering |
| Empty state | Start with a service description or FAQ; selected empty filter returns to All |
| Loading state | Five 72px rows, stable filter bar |
| Error state | List error versus row mutation error kept separate; publication failure leaves item draft and explains retry |
| Mobile behavior | 2-line rows with status below title; actions on an explicit button, never hover-only |
| Motion / micro-interactions | Hover 110ms; publish pending row keeps its position; state changes after confirmation, no celebratory animation |
| What must not appear | Website import “coming next” card, uploaded files/crawls, auto-training meter, model coverage or answer confidence score |

### 9.10 Add/edit Knowledge

| Field | Specification |
| --- | --- |
| Purpose | Write a bounded Text document or FAQ and consciously publish it later |
| Primary user question | “What facts should the agent be allowed to say?” |
| Layout | Full-page editor at existing new/item route; 720px reading measure; type selector, title/question, content/answer; slim publication explanation and footer actions |
| Hierarchy | Content dominates; title label changes with type; publication consequence is visible before saving a published item |
| Primary action | `Save draft` |
| Secondary actions | Cancel/back; publishing remains on saved item/list, not an invented combined save-and-publish request |
| Empty state | Short optional example placeholder; no prefilled business facts |
| Loading state | Existing item waits for revision/data; New opens instantly where possible |
| Error state | Preserve text; show length/type issue or edit conflict. Conflict requires reload/review, never silently overwrite revision |
| Mobile behavior | Single column, 16px editor text, non-overlapping save/cancel footer; type choices stack if needed |
| Motion / micro-interactions | Input focus 110ms; native caret/selection; no expanding card animation or autosave indicator |
| What must not appear | Rich HTML editor, source imports, autosave/publish claims, version rollback, writing assistant or unlimited content |

Keep limits and revision hidden fields. Explain “Saving edits returns this item to Draft; publish again before it can be used.” Warn on leaving unsaved local text; do not imply a saved backend draft before submit.

### 9.11 Channels

| Field | Specification |
| --- | --- |
| Purpose | Show how real customers can reach the configured front office |
| Primary user question | “Where is Avenlyo available, and what still needs setup?” |
| Layout | Two large, unboxed connection rows on a continuous plane; channel icon/name/one-line purpose, factual state and next action. Selected channel expands configuration below or in a linked sheet |
| Hierarchy | Channel → exact state → next step; published-knowledge/Agent link above install instructions |
| Primary action | Configure Website Chat when absent; otherwise open its installation detail |
| Secondary actions | Inspect Instagram state; Open Inbox; owner disconnect where applicable |
| Empty state | Both supported channels shown with setup explanation; no empty app-store grid |
| Loading state | Two channel-shaped rows; state text withheld until loaded |
| Error state | Failed fetch shows channels unavailable; do not show Disabled/Not configured on error |
| Mobile behavior | Stack rows; configuration becomes full-screen sheet/section; snippet scrolls within code area |
| Motion / micro-interactions | 240ms configuration sheet, disclosure arrow 110ms; save status after response |
| What must not appear | WhatsApp/Email/SMS/Voice placeholders, integration marketplace, unsupported self-service Instagram Connect, token entry |

Preserve `Meet customers where they are` as page heading unless browser assertions are deliberately updated later.

### 9.12 Website Chat configuration

| Field | Specification |
| --- | --- |
| Purpose | Configure approved origins and provide the actual installation script |
| Primary user question | “How do I enable chat on the right website?” |
| Layout | Three sections: approved websites, enable/save, install. Optional static visual anatomy preview labeled illustrative; never simulate a working installation |
| Hierarchy | Origins → enabled choice → Save Website Chat → server-derived snippet → Copy snippet; channel state and last activity nearby |
| Primary action | `Save Website Chat` |
| Secondary actions | Copy snippet; local demo only when the existing HTTP-local condition is true; close configuration |
| Empty state | Exact-origin examples as placeholder only; show snippet only after connection exists |
| Loading state | Disable save duplicate; retain origins; copying independent of server-save pending state |
| Error state | Explain exact HTTPS origins, www variants, no paths/wildcards, maximum ten; save failure preserves text; copy failure leaves selectable code |
| Mobile behavior | Origin textarea full width, 16px text; code block has contained horizontal scrolling or wrapping; copy target ≥44px |
| Motion / micro-interactions | Copy label becomes Copied only on clipboard success, returns after 2s; no installation confetti |
| What must not appear | Automatic domain verification, installation-success detection, branding editor, custom welcome text, color picker, production preview that doesn't exist |

`Ready` means enabled without recorded activity; `Active` means enabled with recorded past activity. Neither proves a widget is currently installed/online. Disabling or removing an origin affects existing sessions; state this near the relevant edit, not as a global warning banner.

### 9.13 Instagram state

| Field | Specification |
| --- | --- |
| Purpose | Make managed connection state legible and operable |
| Primary user question | “Is the correct account connected, or do I need operator help?” |
| Layout | Compact state section: status, verified username/account when present, capability summary, managed-setup guidance and disconnect action separated below |
| Hierarchy | Connection state → account identity → supported text/window behavior → next step |
| Primary action | Connected: `Open Inbox`; otherwise read the founder-assisted setup instructions; no nonfunctional setup button |
| Secondary actions | Owner `Disconnect Instagram` with a confirmation explaining consequence; members see read-only restriction |
| Empty state | `Not configured` and concise professional-account/operator requirement |
| Loading state | Withhold account/state until fetch completes |
| Error state | Distinguish fetch unavailable from `needs_attention`; retain known state on refresh failure |
| Mobile behavior | Account ID wraps; no wide credential fields; disconnect footer within normal page flow |
| Motion / micro-interactions | State update 110ms after response; disconnect pending clearly locks duplicate action |
| What must not appear | OAuth, reconnect/token refresh button, token/app-secret fields, verified customer identity, unsupported media delivery or guaranteed uptime |

States: connected requires enabled + `status=connected` + verification timestamp; otherwise honor `needs_attention`, disconnected, managed setup required or no record. Distinguish an old verified account from an enabled connection.

### 9.14 Test Agent

| Field | Specification |
| --- | --- |
| Purpose | Try the same runtime safely using saved settings and published facts |
| Primary user question | “How does my saved front office respond to this customer situation?” |
| Layout | Agent's Test Agent tab; prominent persistent Test mode label; 680px chat canvas with 260px outcome/reference column at large widths |
| Hierarchy | Test boundary → customer input/response → paused state → linked test lead/history |
| Primary action | `Send` / `Retry same message` |
| Secondary actions | New test, Resume test AI, View test lead, View saved conversation; change behavior/knowledge via actual routes |
| Empty state | Three optional scenario prompts: question, service interest, request for a human; clicking fills input, does not automatically send |
| Loading state | “Preparing an answer…” text, not fabricated token streaming; lock first-turn composer until durable URL sync completes |
| Error state | Unknown result retains same idempotency key/content; known failure allows existing new-message recovery; keep local text |
| Mobile behavior | Outcome/reference column becomes disclosure below title; conversation/input get primary space; New test in header |
| Motion / micro-interactions | Saved messages appear 150ms; no automatic send on tab change or sparkle loading sequence |
| What must not appear | Real-customer composer, staff notification promise, editable system prompt, unsaved-setting preview, AI evaluation score or fake live source tracing |

Test mode must state that conversation and lead records are saved as tests and no external customer messages or staff notifications are sent. Paused test still supports the existing semantics; do not imply the team can send human replies from this test surface.

### 9.15 Test conversation history

| Field | Specification |
| --- | --- |
| Purpose | Return to saved tests and inspect answers/source titles |
| Primary user question | “What happened in my previous test, and can I continue it?” |
| Layout | Existing `/app/conversations` becomes Agent's Test history tab filtered to tests; rows show short test ID, timestamp and AI state. Detail is a readable transcript |
| Hierarchy | Test boundary → most recent tests → transcript → saved knowledge references |
| Primary action | Open test; detail `Continue test` |
| Secondary actions | New test; View linked test lead; source-title disclosure where valid |
| Empty state | Start a new test and explain what gets saved |
| Loading state | List-shaped skeleton; detail transcript-shaped placeholder |
| Error state | Test history unavailable distinct from none; partial transcript/source issues do not invent missing content |
| Mobile behavior | One full-screen list/detail route; Back preserves position |
| Motion / micro-interactions | Instant selection/navigation, no history stagger or message-entry effects on old content |
| What must not appear | Real customer rows, deletion/rename controls, entire unlimited transcript when only first 100 loaded, regression-test pass rate |

Expose the 100-record / 100-message current limits as truthful loaded-history notes when reached; this research does not add a backend history API.

### 9.16 Settings

| Field | Specification |
| --- | --- |
| Purpose | Manage business identity and inspect workspace essentials |
| Primary user question | “Which business is this, and can I change its name?” |
| Layout | 680px document form: name/edit + Save changes; quieter read-only role, creation date and workspace ID below a divider |
| Hierarchy | Business name → save → role → technical ID disclosure |
| Primary action | Owner `Save changes` |
| Secondary actions | Manage workspaces; sign out in workspace menu |
| Empty state | Not applicable to valid workspace; missing context routes through existing guard |
| Loading state | Form placeholder, disabled until data is known |
| Error state | Preserve name; explain failed save and role restriction; retry |
| Mobile behavior | Single column; workspace ID wraps and remains selectable |
| Motion / micro-interactions | 110ms focus and server-confirmed save feedback |
| What must not appear | Billing, team management/invitations, notification recipients, API credentials, account deletion, retention controls or integrations not implemented |

### 9.17 Website Chat widget

| Field | Specification |
| --- | --- |
| Purpose | Give visitors an honest, low-friction business conversation with team continuity |
| Primary user question | “Can this business help me, and am I speaking to AI or the team?” |
| Layout | Desktop 376×min(600px, viewport height minus 112px), bottom-right; name/header, status sentence, flexible transcript, simple composer. 56px launcher; 16px panel radius |
| Hierarchy | Business name → AI disclosure or team-needed status → messages → input/send |
| Primary action | Send message / Retry same message |
| Secondary actions | Close/reopen; Load earlier messages; Start a new chat only for the existing unavailable-session state |
| Empty state | Short greeting outside the persisted transcript; invite a question without promising staff availability |
| Loading state | Opening conversation / preparing response text; no fake typing or streamed output |
| Error state | Network/unconfirmed result retains content and UUID; unavailable session provides existing restart; known saved-message failure explains team continuation without promising notification |
| Mobile behavior | ≤600px: inset 8px panel sized to `100dvh - 16px`, safe-area and keyboard-aware composer; launcher hidden while panel open; restore launcher focus on close |
| Motion / micro-interactions | 240ms opacity/8px opening, 150ms newly persisted messages; focus input after open only if interaction permits, do not unexpectedly summon a mobile keyboard |
| What must not appear | Online staff avatars, reply-time promises, appointment actions, file upload, new visitor contact form, sent/read ticks, raw session IDs, HTML-rendered model output |

Keep Shadow DOM, origin-native installation and text-only message insertion. Desktop widget is non-modal and must not trap the host page's focus; Escape/Close returns to launcher. If mobile is presented as modal, label it correctly, contain focus and make only the underlying host page inert while open, restoring it on close. This is accessibility presentation work, not an authentication/session redesign.

### 9.18 Mobile navigation

| Field | Specification |
| --- | --- |
| Purpose | Reach frequent jobs with one hand and keep conversations usable |
| Primary user question | “Where am I, and how do I return to my work?” |
| Layout | Below 768px: 56px top identity header + content + 64px bottom bar with Home / Inbox / Leads / Menu; safe-area padding extra. Thread replaces bottom bar with composer, retaining header Menu |
| Hierarchy | Current business and page → work → navigation. Active tab has text + icon + surface treatment |
| Primary action | Destination tap; in thread, reply/claim takes precedence |
| Secondary actions | Menu sheet for Agent, Knowledge, Channels, Settings, workspaces and sign out |
| Empty state | Navigation stays present even when content is empty; no empty menu placeholders |
| Loading state | Destination highlights immediately; content skeleton remains within frame |
| Error state | Route error retains navigation and workspace context |
| Mobile behavior | Minimum 44px hit areas; at 320px label wrapping is prevented with four short tabs; no hover-only functions |
| Motion / micro-interactions | Menu 240ms; Back and route changes immediate; browser Back works naturally |
| What must not appear | Desktop sidebar squeezed into permanent phone rail, >4 bottom destinations, customer counts derived from tests, gestures as the only navigation |

## 10. Inbox deep-dive

### 10.1 One conversation, two stable work panes

Choose **master-detail with optional context**. Count the app sidebar separately from work panes:

| Width | App navigation | Conversation navigator | Thread | Context |
| --- | --- | --- | --- | --- |
| ≥1440px | 208px | 320px | Flexible, minimum 520px | 280px optional dock; default closed for first use |
| 1024–1439px | 208px | 320px | Flexible, minimum 496px at 1024 | Overlay drawer, never steal message width |
| 768–1023px | 72px labeled-via-accessible-name compact rail | Full available width until selection | Selected thread replaces list | Sheet |
| <768px | Top header + mobile navigation | Full-screen list | Full-screen selected route | Full-height sheet |

At exactly 1024, 208 + 320 + 496 = 1024, so Inbox has no external content gutters. Borders are included in box sizing. At 1440 with dock, 208 + 320 + 280 leaves 632px for thread. Above 1800px, increase reading-side inner margins rather than scaling type or widening message paragraphs indefinitely. Thread text measure remains ≤68 characters; no width cap on the overall working pane.

Why not persistent three work columns everywhere? Avenlyo has only a few contextual fields in the thread payload. Reserving a blank CRM panel would shrink the core conversation. Why not a slide-out list by default? It would add a navigation action every time an operator switches customers. Why not just separate pages? It loses list position and makes repeated handling feel fragmented.

### 10.2 Conversation navigation

- Default order remains most-recent activity, matching `inbox_snapshot`; page size 50, visible range label, Previous/Next. Do not call it a priority queue.
- Row anatomy: 14/20 semibold customer reference, 12/16 activity at right; 13/18 two-line preview; final line with channel and short handling text. An exceptional delivery line may grow row height; do not truncate the error to fit an arbitrary fixed row.
- Fallback identities: lead name/company is already resolved in snapshot; otherwise `Website visitor · <short reference>` or `Instagram customer · <reference>`. External sender ID is not a verified handle or customer profile. No invented initials/avatar when name is missing.
- Selected row uses pale blue fill and a 2px cobalt rule plus `aria-current`; focus ring is separate. Attention uses an amber/red symbol **and text**, never a fake unread dot.
- Keep pagination and scroll position in URL/session UI state. The thread's ID is the source of selection. A direct detail link can render the corresponding list page if known; if not, show Recent and a selected-thread header without pretending the row is in the loaded page.
- Current implementation polls only selected thread, not list. V1 redesign may retain explicit list Refresh; do not promise a realtime list. If later adding snapshot refresh, keep selected row/draft stable and indicate new activity without silently reordering under a pointer.

### 10.3 Header, messages and context

The thread header places identity/channel on the left, Context and allowed action on the right. Below, one **handling strip** says `AI active` or `Needs human · AI paused`; ownership sits beside it as `Unclaimed`, `Claimed by you` or `Claimed by a team member`. These are two axes, not a combined workflow dropdown.

Use a continuous chronological timeline. Customer messages align left with warm-gray fill; AI and human messages align right with white or very pale blue fill. All have visible author labels: `Customer`, `Avenlyo · AI`, `Team · human reply`. Human-actor ID can identify “You” for the current actor, but never yields another member's name. Color is supporting evidence, not the only authorship cue. Avoid avatars made to look like real staff.

Message body: Inter 15/23, plain text, preserved newlines and safe word wrapping. Maximum bubble width 78% desktop / 92% mobile; long operational answers may use the full reading measure. Group consecutive same-role messages with 8px gaps, other author changes 20px. Keep each message's timestamp available as visible 12px text or keyboard/touch-accessible detail; use `<time datetime>`. Day separators are derived from timestamps, not system events. Render dates in the viewer's local timezone; do not label a customer's timezone when it is unknown.

Context contains only: channel and safe customer reference; lead name/qualification and `View linked lead →`; current ownership; staff notification rows. Full contact/summary stays on Lead detail. A future member-scoped lead read could enrich context, but it is **not necessary for v1** and must not be faked from the present thread payload. Keep current delivery history near relevant messages; an “Attention” disclosure can collect exceptional records from the loaded delivery set, labeled as such.

Saved source titles may be disclosed beneath an AI answer if valid source-reference JSON exists. Label them “Knowledge used for this saved answer,” not “AI reasoning,” “confidence,” or a claim that the current source is still published. No source is invented for deterministic handoff responses.

### 10.4 Ownership and AI transition matrix

| Current truth | Primary action | Secondary allowed actions | Composer | Server-confirmed outcome |
| --- | --- | --- | --- | --- |
| AI active, no claim | Claim conversation | Context/lead | Disabled with claim explanation | Claim → paused, assigned to you; linked lead may change to needs_human |
| AI paused, no claim | Claim conversation | Resume AI | Disabled with claim explanation | Claim retains pause; Resume activates next-message AI |
| AI paused, claimed by you | Send human reply | Release conversation; Resume AI if no uncertain submission | Enabled | Reply persists as human and stays paused |
| AI paused, claimed by another | Read conversation | Context/lead, refresh | Disabled; claimed-by-member explanation | No takeover/assignment UI; current server authority decides conflicts |
| Unconfirmed human reply | Retry same reply | Inspect thread, refresh | Submitted text frozen | Same UUID + content checks persisted result, never creates a new automatic resend |
| Any operation pending | Pending label on initiating control | Non-conflicting navigation/context only | Mutation-sensitive controls disabled | Refresh exact thread before advertising new permission/state |

Release remains paused and unclaimed. Resume clears your claim as well as activating AI; describe this consequence in a compact action disclosure: “Remove the claim and let AI answer the next customer message.” Use one deliberate click after that explanation is visible; do not make Resume an adjacent default submit or keyboard shortcut. No server “pause AI” action exists outside claiming/handoff; do not add a standalone pause toggle.

An assignee can have lost membership. The backend can reclaim/resume such a thread under its own checks; the current UI conservatively treats a non-self assignee as claimed. Do not invent active-member identity/availability. Any future reclaim affordance requires a precise current-membership read and dedicated acceptance coverage, not a visual assumption.

### 10.5 Reply composer

- Keep label `Your human reply` visible; 96px minimum textarea, expands to 200px before internal scroll. Desktop send target 36px, mobile 44px. Plain text only.
- Before claim, show why input is disabled and put Claim in the handling strip. After claim confirmation, move focus to input if the user initiated the claim. Polling never steals focus.
- Explicit Send button is the default. `Ctrl/Cmd+Enter` can submit only the permitted current draft; plain Enter adds a newline. Hint is available beside Send. Never auto-submit on state changes.
- Website counter/limit: maximum 2000 characters. Instagram shows **UTF-8 byte count / 1000** plus character bound; multi-byte Turkish letters and emoji must be tested.
- Do not clear text or present a final sent bubble before success. A local pending row is permissible only if explicitly labeled “Saving…” and never counted as persisted; simplest v1 keeps pending feedback in composer.
- Keep the immutable submitted content/nonce until the result is known. Retry references that payload, even if the textbox has unrelated new content. Disable new submissions/resume during uncertainty. A per-tab in-memory registry keyed by workspace/conversation can preserve an uncertain request across pane changes; do not add backend drafts or local persistent customer caches.
- Navigation with unsent text should offer a clear discard/return choice. Workspace switching clears the selected thread and any in-memory customer data after resolving/discarding local work; it must not transfer drafts between tenants.

### 10.6 Delivery and notification language

| Raw state | Customer-message label | Action/presentation |
| --- | --- | --- |
| `available` | Available to visitor | Quiet text; no double ticks |
| `pending` / `sending` | Delivery pending / Sending to Instagram | Quiet pending state; not a typing indicator |
| `sent` | Accepted by Instagram | Provider accepted only |
| `unknown` | Delivery unconfirmed | Persistent attention: check channel before a separate follow-up; automatic resend stopped |
| `failed` | Delivery failed | Persistent attention; no unsupported delivery retry action |
| `blocked` | Delivery blocked | Explain known sanitized reason if supplied; otherwise general restriction |

Notification text is separate: email pending / accepted / failed / unconfirmed / suppressed because no verified owner recipient. No staff-email state proves the customer saw a reply. Do not put email success toasts in the customer timeline. Provider error codes should map through a small allowlisted user-facing dictionary with a generic fallback; never render raw provider response bodies.

`needsAttention` in the current snapshot means **any** failed/unknown/blocked delivery exists, including an old one; it has no resolved marker. Therefore label it “Delivery issue recorded,” not “New failed reply” or “Unresolved incident.” Likewise latest-100 delivery data may not cover very old messages; absent delivery detail is not inferred success.

### 10.7 Scrolling, message arrival and mobile

Near-bottom threshold: retain existing 80px behavior. If near the bottom, append confirmed new messages and follow them; if reading history, keep the viewport and show a local “New messages” button. This marker is session-local and must never masquerade as a persisted unread state. Loading earlier messages preserves a stable first-visible message/offset; no jump to bottom. History loads render instantly, with no entrance animation.

On mobile, a compact 56px header includes Back and Context; handling text remains above the transcript; the appropriate Claim/reply action sits within reach. A contextual action menu holds Release/Resume, with consequences stated. Virtual keyboard changes available height; textarea, Send and error text remain reachable. Polling updates state without collapsing the keyboard. Tap timestamps and delivery disclosures must work without hover.

Acceptance scenarios for the later implementation: active→claim→human reply→release→resume; two-member claim race; membership revoked; human claim while AI run is in flight; unknown HTTP reply result; provider unknown versus HTTP retry; paused customer follow-up with no AI response; expired Instagram window; long messages/history; direct links and browser Back; 390px keyboard layout; no knowledge source; inaccessible thread after workspace switch. Run against the existing real local stack/fake providers; this session does not execute them.

## 11. Home deep-dive

### 11.1 Home is a business brief

Reject a chart dashboard (no meaningful trend instrumentation), a generated activity feed (no complete event model), a command box (no general command backend), or a full priority queue (current snapshot is recency-paginated). Home is a concise **business brief** with two jobs: show people who may need help and explain what powers answering.

It uses ordinary authenticated, workspace-scoped reads on already-granted tables. Adding a frontend `select`/filter is later frontend work, not a schema/API change. Required queries and interpretations:

| Home element | Existing data/read | Display rule |
| --- | --- | --- |
| Paused real conversations count | `conversations`, workspace, `channel != test_agent`, `ai_mode=paused`, exact count | Label “AI paused”; includes claimed threads, not “unassigned requests” |
| Up to five paused rows | Same scope, newest `updated_at`, limit 5 | Customer channel reference, ownership, activity; optional linked lead name via bounded member read. No preview required, no invented waiting duration |
| Recent real conversations | Existing snapshot first page, first 3–5 | Label recent; optional when human-work section is empty. Count not presented as global total |
| Published knowledge | `knowledge_items` exact published count; optional counts for draft | “N published items,” not answer coverage |
| Agent summary | Existing `agent_settings` tone/goals/contact fields | “Saved behavior”; list concise effective selections. Do not require a brief or claim settings are validated for every case |
| Website state | Existing `channel_connections` row | Disabled / Ready / Activity recorded. Enabled and activity timestamp are facts, not installation monitoring |
| Instagram state | Same existing row | Connected only with enabled/connected/verified; otherwise managed setup/attention state |
| Optional real lead link | Existing leads source non-test, latest 3 | Text row only; no revenue, trend or conversion claims |

Home's primary paused rows can be derived from `conversations` globally under existing RLS without misusing the limited snapshot. If lead-name enrichment is omitted, use the stored customer reference; do not force a new API for cosmetic context. No real-time claim is made: load on navigation and provide Refresh. A “last refreshed” time is the actual client fetch-completion time, not a server health check.

### 11.2 Composition and state priority

1. If paused real conversations exist, make that section first: “Conversations with AI paused,” exact count and up to five actual rows. This is useful work, not a red emergency dashboard.
2. If none, say “No conversations with AI paused” only after a successful count. Do not say all customers have answers or no follow-up is needed; the product cannot establish that.
3. If no published knowledge, make “Publish your first business fact” the readiness action. If there is knowledge and no enabled channel, make Channels next. Agent/Test remain optional check links; no fake completion meter.
4. If knowledge and a channel exist, show their factual ledger; shrink setup guidance rather than hiding the ability to inspect it. If no real conversation exists, invite the owner to install/check the channel without claiming live installation verification.
5. A section failure shows “Unavailable” and Retry. It never substitutes zero. Do not let successful knowledge fetch imply channels are healthy.

Desktop main column is about 720px, readiness about 320px with a 32px gap; stack at <1024px. The main section uses a clear top rule and row dividers; readiness uses text rows with small status icons. Home gets one editorial title, not a full viewport of onboarding marketing. No graphs, equal KPI cards, percentage rings or “all channels including tests” counters.

## 12. Agent configuration deep-dive

### 12.1 Shape an operating brief, not a prompt

The design hypothesis is that owners should read the resulting behavior as a brief they are giving their front office. This is inspired by the configuration/test separation documented for Notion agents [R45], [R46] and the workflow-embedded AI approach of Granola [R41]. It does **not** import those products' generated instructions or capabilities.

Use four numbered, flat sections on one canvas:

1. **Help customers.** Four supported outcome rows, each with a checkbox, short consequence and one sentence of clarification. Preserve exact goal values: `answer_questions`, `identify_interest`, `qualify_inquiries`, `collect_contact`. They are independent controls, not reordered workflow steps.
2. **Speak in this tone.** Professional / Warm / Concise radio group or segmented native inputs, each with a small static style phrase. Clearly label examples as tone examples, never a generated business answer.
3. **Ask for these details.** Name / Email / Phone / Company native checkboxes. Explain that selected fields participate in qualification and are requested only for genuine interest. Keep schema dependency visible: fields require contact collection. If the user disables collection while fields are selected, show the issue and offer explicit correction; do not silently drop saved requirements.
4. **Bring in a person.** Mandatory disabled checked `Human handoff` control; explain that handoff remains available and the team explicitly resumes AI. This is a product rule, not a configurable schedule, routing rule or escalation threshold.

The **planning note** follows as a secondary disclosure with the existing tested label “What should Avenlyo help your customers with?” and max 1500 characters. Its visible helper must be direct: “A planning note for your team. The controls above define behavior; this note is not sent to the answering AI.” Do not give the note the largest visual emphasis or rename it System instructions.

### 12.2 Effective behavior summary

A 280px side summary is deterministic from the form fields. Example structure: “Answers from published knowledge”; “Recognizes service interest”; “Requests name and email”; “Professional tone”; “Human assistance always available.” Only include a statement if its corresponding control warrants it; qualify answering as grounded in published information. While dirty, label “Unsaved preview of selected settings.” After Save, label “Saved behavior.” No model call, confidence score, fake customer message or hidden brief interpretation.

Saving persists through the existing `saveAgent` action and owner RPC. Test Agent opens the existing route and uses **saved** settings. If form is dirty, show “Save before testing these changes” with Save settings, or clearly open tests using last saved behavior. Do not automatically save when switching tabs. Member view reads as an operating brief with disabled inputs and concise owner-only explanation; do not offer a save that will fail.

### 12.3 Form and publication boundaries

Agent settings have no draft/published version model or compare-and-swap version in the current action. Do not introduce a Deploy agent button or claim rollback/version history. Save success means settings saved, not that the agent passed a test. Concurrent owner edits are an existing limitation; call it out in implementation risks, do not “fix” the backend in a visual slice.

Knowledge links show “Only published items can be used.” Changing a service price belongs in Knowledge, not the planning note. Test Agent must not accept real thread IDs. Human handoff is visible as an invariant in configuration and in real handling state, creating product differentiation without AI decoration.

## 13. Visual system

All tokens below are new proposals. No Avenlyo palette, sidebar, typography or component treatment is inherited as a visual constraint. Cobalt was selected for high-contrast action affordances against warm neutrals, not from the existing purple/green treatments. Green is reserved for confirmed success/status.

### 13.1 Color

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F5F3EE` | Page background, broad calm frame |
| `navigation` | `#EEEAE2` | Single sidebar; no gradient or black secondary rail |
| `surface` | `#FFFFFF` | Working plane, editor, thread |
| `surface-raised` | `#FFFFFF` | Dialog/menu/drawer; elevation distinguishes it |
| `surface-subtle` | `#F2F1ED` | Customer messages, selected contextual sections |
| `text` | `#1E2932` | Main copy, headings |
| `text-secondary` | `#59636C` | Supporting text; not low-opacity body text |
| `accent` | `#2455D6` | Primary actions, links, active small rule |
| `accent-hover` | `#1C43AF` | Hover of filled action |
| `selection` | `#E9EFFD` | Selected conversation/navigation surface; text stays ink |
| `focus` | `#2455D6` | 2px ring + 2px offset; stays distinct from selection |
| `divider` | `#DDDAD2` | Nonessential row/pane structure |
| `control-border` | `#89939D` | Input/control edge when edge is needed for recognition |
| `success-text` / `success-fill` | `#246A4B` / `#EDF5EF` | Published, AI active and confirmed success, always with labels |
| `attention-text` / `attention-fill` | `#8A4B0F` / `#FBF0DD` | AI paused, pending human attention, unconfirmed outcome |
| `danger-text` / `danger-fill` | `#B33E3E` / `#FBEDED` | Failed/blocked action or destructive consequence |
| `neutral-text` / `neutral-fill` | `#4F5A65` / `#EBEFF2` | Draft, archived, unconfigured/disabled |
| `scrim` | `rgba(30,41,50,0.28)` | Modal background only |

Calculated sRGB contrast ratios: body on white **14.81:1**; secondary on white **6.13:1**, on canvas **5.53:1**; white on accent **6.28:1**; success pair **5.84:1**; attention pair **6.01:1**; danger pair **5.02:1**; control border on white **3.12:1**. These check the listed pairs, not the entire future product. Verify composed/translucent/hover/focus states in implementation. Decorative dividers need not carry text contrast; never use them as the only affordance for an essential control.

**Light mode only for initial recreation.** Dark mode would double a meaningful matrix of message/status/focus/host-widget states before the primary experience is validated. Token architecture should permit a later dark theme; no dark toggle or untested OS-matched dark appearance in v1. The widget keeps its own explicit theme inside Shadow DOM.

### 13.2 Typography

Use **Inter** for the UI and **Newsreader** for a small set of editorial titles. Both have official sources and SIL Open Font License references [T01], [T02]. Self-host subsetted WOFF2 files with license notices in a later implementation; preload only the necessary UI face. Keep Latin Extended glyphs for Turkish and test `İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü`. No font download/package change occurs now.

| Role | Face / size / line height / weight | Tracking and restrictions |
| --- | --- | --- |
| Editorial page title | Newsreader 32/38, 500 | `-0.02em`; Home/Agent/Knowledge/Channels/Leads introductions only; 28/34 mobile |
| Auth title | Newsreader 32/38, 500 | Same restraint; tested wording retained |
| Inbox/tool heading | Inter 18/24, 600 | `-0.015em`; no serif in message controls |
| Section heading | Inter 16/24, 600 | `-0.01em` |
| UI/body | Inter 14/20, 400 | Normal tracking; 500 for controls, 600 for selected identity |
| Message body/editor | Inter 15/23 desktop; 16/24 input on mobile | Maximum comfortable reading measure, no letter spacing |
| Supporting label | Inter 12/16, 400–500 | No 10px operational labels |
| Compact table/header | Inter 12/16, 500 | Sentence case; no letterspaced all-caps navigation |
| Numbers/timestamps | Inter 12/16 or 14/20 | Tabular numerals where columns compare numbers; normal case |
| Embed/technical ID | System monospace 12/18 (16px input text on mobile) | Selectable, safe wrapping/contained scroll |

Use no weight above 600 for normal UI. Keep titles concise; no eyebrow/title/paragraph trio on every operational pane. If Newsreader fails to load, use a measured Georgia fallback for those few titles; body remains `Inter, system-ui, sans-serif`. Layout must remain functional with fallback fonts.

### 13.3 Layout and density

| Element | Specification |
| --- | --- |
| Desktop sidebar | 208px including divider; 20px horizontal padding; workspace switch row 44px |
| Compact rail | 72px at 768–1023px; every icon has accessible name and keyboard/touch label disclosure; not hover-only navigation |
| Main chrome | 56px page toolbar where needed; Inbox identity header 64px; no redundant global full-width header plus large page hero |
| Content pages | 32px horizontal/28px top padding ≥1024; 24px tablet; 20px phone |
| Widths | Home/list max 1120px; Agent 1040px; lead detail 960px; Knowledge editor 720px; Settings 680px; Auth 400px |
| Grid | 12-column only for composition on content pages, 24px gutter; do not force Inbox into that grid |
| Inbox | Full remaining viewport; 320px navigator, flexible thread, optional 280px context; geometry in section 10 |
| Rows | 88px conversation base (expand for attention), 60px Leads, 72px Knowledge; 48px compact settings fact rows |
| Controls | 36px desktop baseline, 44px touch minimum; textarea dimensions defined per task |
| Breakpoints | 320 supported floor; 600 widget switch; 768 mobile navigation cutoff; 1024 split Inbox/content; 1440 docked context option |

Allow browser zoom/reflow to reduce columns; use available-width/container checks where a fixed viewport threshold would squeeze content. At 200% zoom, prefer stacked list/detail rather than a horizontally scrolling workspace.

### 13.4 Spacing, radius, borders, elevation and icons

Spacing scale: **2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px**. Use 4px for tightly related label/icon pairs, 8px inside a fact pair, 12px between controls, 20–24px within a meaningful section, 32px between sections and 48px only for major introductory separation. No arbitrary 80px blank space inside working screens.

Radius scale: **0px** continuous work planes; **4px** small status labels; **6px** inputs/buttons; **8px** selected row/menu items; **10px** dialogs/drawers/menus; **16px** widget panel; circle only for launcher/small dots where semantically appropriate. Do not round every panel or use oversized pill buttons.

Use borders for: pane boundaries, row separators, form fields, publication/action grouping, overlay edge. Avoid borders around: every Home fact, every Agent section, every metadata label and the overall message canvas. Customer/AI/human message surfaces can distinguish by fill/author label; do not stack colored borders around every bubble.

Shadows: content planes and ordinary lists **none**; popover `0 4px 16px rgba(30,41,50,.10)`; modal/drawer/widget `0 12px 40px rgba(30,41,50,.16)`. Avoid combining a strong shadow, thick border and colored background on one ordinary control. Drawers below dock width use overlay elevation; docked context uses a divider and no shadow.

Keep **Lucide**: 18px navigation, 16px inline, 20px primary standalone controls, stroke 1.75–2. Use named imports. One icon per navigation destination; no icon in every sentence, no decorative sparkle on every AI label. Use a consistent authored text/mark treatment for Avenlyo; logo exploration is a separate decision and must not delay task clarity. Icon-only controls need accessible labels and touch/keyboard disclosure. Status always pairs icon/color with readable text.

## 14. Motion system

The token values and curves derive from the documented Carbon productive-motion baseline [M01]; assignments and distances are **Avenlyo proposals**, not measurements of competitors. Use CSS transitions/keyframes first. No animation dependency is needed for this specification.

### 14.1 Tokens and easing

| Token | Value | Intended use |
| --- | --- | --- |
| `instant` | 0ms | Route/frame changes, permission changes, selection, error availability, history render |
| `press` | 70ms | Color feedback on button press; no scaling required |
| `feedback` | 110ms | Hover/focus-adjacent color transitions, tiny disclosure state |
| `reveal` | 150ms | Small content reveal, new persisted message, command surface |
| `panel` | 240ms | Drawer/modal/widget opening, small purposeful expansion |
| `standard` | `cubic-bezier(.2,0,.38,.9)` | Elements staying visible, reversible panels |
| `enter` | `cubic-bezier(0,0,.38,.9)` | New surface/message entering |
| `exit` | `cubic-bezier(.2,0,1,.9)` | Dismissed toast/modal |

### 14.2 Behavior map

| Element | Enter/change | Exit / exception |
| --- | --- | --- |
| List hover | 110ms background color, standard | Same on pointer leave; no movement |
| Selected conversation | Immediate rule/tint/`aria-current` | Instant; do not animate the row across the list |
| Thread change | Clear old identity/content/composer atomically; content instant if ready, optional 110ms fade | No old/new customer crossfade, no slide |
| Context drawer | 240ms translateX 16px→0 + opacity, enter | 150ms standard; close but imply recoverable context; avoid animating document layout |
| Modal | 150ms opacity and translateY 6px→0, enter; scrim 150ms | 110ms exit; focus behavior immediate |
| Command “Go to…” | 150ms opacity/4px translate, enter | 110ms; actions remain keyboard predictable |
| Toast | 240ms opacity/8px translate, enter | 150ms exit; success 4s with dismiss, pause timer on hover/focus; errors stay inline |
| New persisted message | 150ms opacity/4px translate, enter | No exit animation; load/replay/deduplicated history renders instant |
| AI pause/resume | Replace text/icon after server response; optional 110ms background change | No loop/pulse or fake intermediate AI mode |
| Widget opening | 240ms opacity/8px translate, enter; transform origin bottom-right | 150ms standard; restore focus; do not delay session request |
| Button feedback | 70ms background on press; pending label immediate | Avoid bouncing/scaling text and layout shift |
| Knowledge publication | Pending text immediate; status after response; 110ms color | Do not fly item to another filter or hide failed operation |
| Onboarding/readiness | Completion icon color 110ms after confirmed data | No ring/count animation or celebration |
| Skeleton | Show after 150ms if still pending; static blocks | Remove as data arrives; no artificial minimum loading time |

Animate layout only for a user-requested short disclosure if it does not move focused input or disorient reading. Dock/undock and breakpoint changes can be immediate; conversation reordering is immediate on explicit refresh. No route-wide View Transition is necessary. No springs, overshoot, parallax, typewriter output, animated charts, continuous shimmer or ambient AI glow.

### 14.3 Reduced motion and accessibility

Under `prefers-reduced-motion: reduce`, all translation, scale, scrolling animation and animated layout become immediate. Color/opacity may also become immediate for consistency. No stagger; skeletons remain static; new-message/status meaning is preserved with text and live announcements. Focus is never delayed until animation end. Announce one concise message/status update in a polite live region; do not re-announce the entire thread on every poll. Attention/error wording remains visible after any toast disappears.

## 15. Reusable component map

Keep abstractions at task boundaries. Shared visuals do not justify a generic schema-driven settings framework.

| Component | Responsibility | Existing starting point / boundary |
| --- | --- | --- |
| `AppShell`, `MainNavigation`, `WorkspaceSwitcher`, `MobileNavigation` | Frame, route state, workspace scope | `app/app/layout.tsx`, `sidebar.tsx`; keep auth/workspace guards server-side |
| `PageIntro`, `PaneToolbar` | Editorial page start versus compact operational header | Split responsibilities of `page-header.tsx`; do not use one oversized header everywhere |
| `StatusIndicator` | Text + icon + semantic tone for one dimension | Existing Badge can supply geometry; don't turn all states into one enum |
| `ReadinessLedger`, `HandoffBrief` | Home's factual setup and paused-conversation sections | Compose page queries; no analytics state store |
| `ConversationList`, `ConversationRow` | Snapshot rendering, selection and pagination | Inbox page; preserve semantic links and limited scope |
| `ConversationHeader`, `HandlingControls` | Identity, current AI/ownership, allowed actions | Inbox conversation; never owns authorization |
| `MessageTimeline`, `MessageItem`, `DeliveryIndicator` | Pagination/scroll/roles/source and delivery disclosure | Share safe message primitives with tests where sensible; widget remains separate bundle |
| `ReplyComposer` | Claim gating, limits, immutable uncertain payload, send/retry feedback | Isolate existing nonce logic, not a new transport layer |
| `ConversationContext` | Small current lead/notification facts and links | Uses actual thread payload, not generic CRM inspector |
| `AgentBehaviorEditor`, `EffectiveBehaviorSummary` | Structured settings + deterministic preview | `agent-form.tsx`; single save contract preserved |
| `KnowledgeList`, `KnowledgeEditor`, `PublicationActions` | Content and explicit publication workflow | Knowledge pages/forms/actions; retain revision handling |
| `ChannelRow`, `WebsiteInstallation`, `InstagramState` | Honest channel-specific setup | `channel-forms.tsx`; do not force different workflows into generic ConnectCard |
| `LeadList`, `LeadFacts` | Inquiry ledger and customer-stated facts | Leads pages; real/test source context preserved |
| `TestWorkspace`, `TestHistory` | Sandbox boundary, existing runtime and saved tests | `test-chat.tsx`, test/conversation routes |
| `EmptyState`, `InlineNotice`, `FieldError`, route-specific skeletons | Task-specific states | Keep existing primitives but replace generic content |
| `Dialog`, `ContextDrawer`, `Toast`, optional `GoToMenu` | Focus/disclosure/feedback | Small native/platform-based wrappers, not a giant overlay framework |

Do not abstract the Inbox/Test/visitor composers into one conditional component: they have different authority, retries, payloads and delivery guarantees. Share typography/state vocabulary and pure rendering helpers where appropriate, while keeping mutations and session boundaries explicit.

## 16. Technical frontend strategy

### 16.1 Audited stack

pnpm monorepo: Next.js **16.4.0** App Router, React/React DOM **19.3.0**, TypeScript, Tailwind **4.3.3**, Supabase SSR **0.12.7** / supabase-js **2.117.3**, Zod **4.6.7**, Lucide **1.56.0**, CVA/clsx/tailwind-merge. UI files are local shadcn-style Button/Input/Badge/Textarea/Card primitives; Radix Slot is present, but this is not a full Radix/shadcn overlay installation. Server Components read workspace data; client forms use `useActionState`; Inbox/Test use existing BFF endpoints. Widget is a plain JS string served by Fastify with Shadow DOM, not a React widget.

These are repository versions at the audited SHA, not upgrade recommendations. No install/build/runtime provisioning was needed for this documentation audit.

### 16.2 Keep/change decisions

| Technology | Decision | Justification and limits |
| --- | --- | --- |
| Next.js / React / pnpm | Keep existing versions | No framework rewrite necessary for a new shell/layout |
| Tailwind | Keep | Useful for layout/responsiveness; put semantic palette/radius/motion in CSS variables, avoid per-page arbitrary color strings |
| Existing shadcn-style primitives | Keep and restyle deliberately | Replace current visual assumptions; remove Card wrappers where inappropriate. Do not install a full UI framework |
| Lucide | Keep | Already present; consistent restrained outline icons; named imports |
| CSS variables | Expand | Semantic surface/text/status tokens and limited geometry/motion; widget gets matching literal tokens within its isolated CSS |
| Native `<dialog>` | Prefer for true modal and mobile menu/context sheet | Standard top-layer/focus behavior reduces dependency cost; must follow WAI and HTML semantics, test focus return/inertness/scroll lock. Nonmodal desktop context is an `<aside>` |
| Native inputs/selects | Keep actual semantics | Tone can be native radios visually styled; no custom combobox needed for three options |
| Motion / Framer Motion | **Do not add in initial recreation** | This spec needs CSS opacity/transform transitions, not shared-layout choreography. Official guide reports ~43kb for `motion`, just-over-5kb initial LazyMotion plus feature bundles; sizes/builds vary [M02] |
| Command palette dependency | Defer | Six destinations do not require a palette. If validated later, a focused keyboard primitive can be evaluated against accessibility/bundle needs |
| Tooltip dependency | Avoid initially | Prefer visible labels and explicit disclosure; native title alone is not enough for critical meaning. A small proven primitive may be considered only for actual icon-only controls |
| New table/form/state framework | No | Existing list sizes and forms do not justify TanStack Table, a form engine or global client store |

If future prototypes require interruptible shared-layout transitions or coordinated presence that CSS becomes difficult to maintain, scope a Motion proof to context panels only and measure Next webpack route output. Official package-size claims are not this app's measured impact; LazyMotion defers feature cost rather than eliminating it. No animation library goes into the tiny public widget. No dependency changes in this session.

### 16.3 Frontend boundaries to preserve

- Keep `requireWorkspace` and active membership validation. The workspace cookie is a preference, not authorization. Clear prior-workspace UI/client state on switching.
- Keep origin/body checks, no-store responses, verified access tokens, runtime authority and all idempotency keys. No direct browser DML or service-role key.
- Use existing RLS-readable tables for scoped frontend counts/source filters; distinguish these from new backend capability. Keep current `inbox_snapshot` page scope truthful.
- Keep selected conversation as durable URL state; test `conversation` query continues to identify a test. A nested Inbox layout can preserve the list without changing runtime APIs. Protect against stale requests arriving after selection changes.
- Render model/customer/provider-derived content as text. Do not introduce raw HTML/unsafe Markdown rendering while redesigning messages or Knowledge.
- Preserve source revision and publication boundaries, ownership race handling, first-test route synchronization, polling cadence/visibility guards and safe retries.
- Route-specific skeletons/errors should reflect their actual content. Client polling errors must not erase a still-useful thread; errors and uncertain sends remain visible, not toast-only.
- Avoid client hydration of all workspace records for visual convenience. No session tokens, private customer bodies, credentials or telemetry in design demos/screenshots.
## 17. Implementation sequence for a later approved session

**Do not execute these slices now.** Start each slice from the then-current branch; check diffs against this audit because product behavior may evolve. Keep route/API compatibility or explicitly update browser selectors with equivalent coverage. All likely file paths below are relative to repository root; “new” means a possible frontend file in the future.

| Slice | Likely files | Visual output | Risk / regression-sensitive behavior |
| --- | --- | --- | --- |
| 1. Tokens + shell + Auth/workspace | `apps/web/app/globals.css`, `app/layout.tsx`, `app/app/layout.tsx`, `components/sidebar.tsx`, `page-header.tsx`, `components/ui/*`, auth/workspace pages/forms; new shell/mobile components, font assets/licenses | New sand/white/ink/cobalt frame, title hierarchy, labeled nav, usable auth and mobile Menu | Medium: current-workspace guard and switching; sign-in/out/confirmation; exact accessible names; no service-role client exposure |
| 2. Home brief | `apps/web/app/app/page.tsx`, route skeletons; new readiness/paused-row components | Human-work list + factual setup ledger, no mixed/test KPIs | Low/medium: read filters must exclude tests; exact counts vs five rows; partial failures vs zero; no fake setup completion |
| 3. Inbox navigation and thread | Inbox route pages; new `app/app/inbox/layout.tsx` if appropriate; `components/inbox-conversation.tsx` split into task components; frontend context/dialog primitives | Full-height master-detail, optional context, readable timeline, handling strip and composer | **High**: claim races/current membership, nonce identity, stale polling/selection, release remains paused, resume next-message only, delivery wording/window/byte bound; no API change |
| 4. Agent and tests | Agent page/form, Test Agent page/`test-chat.tsx`, Conversations pages, new effective-summary component | Operating brief, saved-state summary, Agent tabs, separate Test history | Medium/high: brief excluded from runtime, mandatory handoff, schema dependency, first-turn durable route, same-message retry, real/test isolation |
| 5. Knowledge + Leads | Existing Knowledge/lead pages/forms/actions presentation, `knowledge-actions.tsx`, read-scope filters | Publication-aware document editor/library and real/test inquiry ledger | Medium: revision conflicts, edit→draft, publish failure, owner-only controls, source-linked routing and 100-item truth |
| 6. Channels and Settings | Channels page/forms, Settings/business-form; new channel-specific sheets | Factual connection rows, clear website install steps and managed Instagram state | Medium/high: exact origin rules, enabled flag vs verified state, owner access, disconnect consequence, public ID vs secret, no production local-demo link |
| 7. Visitor widget presentation | `apps/api/src/channels/widget.ts` **presentation-only portion**, optional local demo host styling | New launcher/panel/messages, accessible open/close/mobile keyboard behavior | **High**: file sits in API package; tightly review that no session/network/runtime logic changes. Keep Shadow DOM, textContent, bearer scope, pending UUID, earlier cursor/polling and role markers |
| 8. Responsive/motion and final visual QA | Frontend CSS/components just introduced; widget presentation CSS; existing browser specs when intentional labels change | Coherent 320/390/768/1024/1440/1920 layouts, reduced motion, all states | Medium: keyboard/focus/read order, long strings/200% zoom, no page overflow, stale/offline/error/owner-member variants |

Scope guard for Slice 7: the user forbids backend changes for this research session. In implementation, widget presentation happens to reside in a backend file; request approval of that **specific presentation-only scope** as part of the implementation brief. Do not refactor runtime/transport/credential logic under the label of widget styling.

### 17.1 Required validation once implementation is approved

Use the repository's existing typecheck, lint/independence, unit tests and build for actual code changes; run existing Foundation and channel Playwright flows on the documented disposable local stack with fake providers for relevant slices. Preserve existing behavioral suites instead of writing tests that merely snapshot Tailwind classes. Do not run database reset/live-provider setup as a casual design-preview step.

Visual QA: representative populated/empty/loading/error states; owner/member; AI active/paused/unclaimed/self/other; failed/unknown/blocked/available/sent; no lead/partial lead/test lead; long and Turkish text; 200% zoom; keyboard navigation; reduced motion; dark host page with widget; safe-area/virtual-keyboard phone sizes. Verify state conflict and unknown-result recovery, not just screenshots of successful paths.

Completion gate: no unintended product/backend diffs, no dependency drift, existing behavior remains accepted, exact labels accounted for, UI passes the device/state review. Then stop for product review before any publication/deployment decision.

## 18. Risks, limitations and evidence debt

| Risk | Design response / next validation |
| --- | --- |
| Public evidence is not hands-on product testing | Registry distinguishes V/D/I/U; no inferred timings or mobile breakpoints attributed to competitors. Optional future signed-in comparison only if separately authorized/available |
| Older screenshot assets on active docs | Plain/Linear historical references and Railway media are labeled; recent Front/Help Scout/Vercel/Attio releases anchor current direction |
| No usability study with actual owners yet | Prototype five tasks after direction approval: find paused customer, claim/reply/release, explicitly resume, publish a corrected fact, understand test versus real lead |
| Existing snapshot provides recent page, not global search/queues | Default Inbox remains Recent. Do not filter a partial page invisibly. Home paused query is independently scoped across existing real conversations |
| Existing history/delivery limits | Label loaded-history boundaries; do not promise complete activity for old tests or every historic delivery |
| Historical delivery error keeps attention boolean true | Use “issue recorded,” not unresolved/new; no dismiss/resend capability invented |
| Settings concurrent edits | Existing action lacks revisioned settings UI; preserve semantics, avoid false conflict-protection/version claims |
| Brief mistaken for prompt | Secondary planning-note placement with explicit “not sent to AI” helper |
| Full CRM context assumed | V1 uses only thread lead id/name/qualification and routes to full lead detail |
| Claim changes qualification | Show actual state; qualification is not a promise of commercial readiness. Never treat resume as restoring prior qualification |
| New shell accidentally leaks stale tenant/thread state | Abort/ignore stale responses, key by workspace/thread, clear local scope on switch; regression tests required |
| Message retry loses identity during pane changes | Preserve immutable uncertain payload in per-tab memory; no new send/resume until resolved; test navigation/reload limits explicitly |
| Font and color QA | Ratios checked only for proposed pairs; validate actual rendered combinations, fallback metrics and Turkish glyphs |
| Mobile keyboard and overlays | Real browser/phone QA needed, not just 390px static screenshots; dialog/focus/host-page inertness requires review |
| Widget styling shares backend source file | Later diff must stay inside presentation markup/styles/accessibility; do not change auth/transport/runtime while restyling |
| Instagram/provider limits | Audit describes repository behavior, not a new live Meta/Resend eligibility or delivery test. Revalidate provider contract if future implementation changes semantics; none is proposed here |

## 19. Open design decisions and approval boundary

The core recommendation is sufficiently fixed for implementation planning: Direction B, light-only, 208px sidebar, 320px master-detail Inbox, optional context at 1440px, Home brief, operating-brief Agent, Inter/Newsreader, warm neutrals/cobalt and restrained CSS motion.

| Decision | Recommended default | What remains to decide |
| --- | --- | --- |
| Direction selection | Approve B without mixing shells | Owner's explicit approval before any code |
| Editorial title face | Newsreader only on page introductions | Visual approval with real Turkish/English content after first static design slice |
| Avenlyo mark | Small text wordmark, no new mascot | Separate brand exploration if wanted; not a blocker for UI clarity |
| Command menu | Defer; later navigation-only “Go to…” | Validate frequent users actually need it |
| Inbox global filters/search | Omit in initial recreation | Separately scope efficient member-read composition if operator volume requires it; no backend feature assumed |
| Context contact enrichment | Keep full contact on Lead detail | Optional existing RLS lead read later, if tested and useful |
| Default docked context | Closed at first use | Can remember a local layout preference; not a server user preference |
| Initial language | Preserve current English product strings | Turkish localization is a separate scope; glyph support included |
| Persistent unsent drafts | No backend draft feature | Decide whether per-tab memory is enough; do not add cross-device claims |

**Stop condition:** research and text wireframes complete; documentation only. No UI implementation, package change, backend modification, redesign commit, deployment or implementation PR begins until explicit approval.

### Source references

[R01]: https://www.intercom.com/help/en/articles/6258745-the-inbox-explained
[R02]: https://www.intercom.com/help/en/articles/7911926-customize-the-inbox-to-suit-you-and-how-you-work-best
[R03]: https://help.front.com/en/articles/3889728
[R04]: https://linear.app/docs/inbox
[R05]: https://linear.app/now/how-we-redesigned-the-linear-ui
[R06]: https://attio.com/changelog/2026/record-page-redesign
[R07]: https://attio.com/help/academy/introduction/record-pages
[R08]: https://knowledge.hubspot.com/help-desk/overview-of-the-help-desk-workspace?wvideo=t0gfmlcvqz
[R09]: https://knowledge.hubspot.com/help-desk/manage-tickets-in-help-desk?ntref=1
[R10]: https://www.plain.com/changelog/redesigned-sidebar
[R11]: https://www.plain.com/changelog/introducing-sidekick
[R12]: https://articles.helpscout.com/blog/introducing-conversation-sidebar/
[R13]: https://help.crisp.chat/en/article/getting-started-with-the-crisp-inbox-1a9mi26/
[R14]: https://help.crisp.chat/en/article/how-are-conversations-ordered-in-the-inbox-602oo6/
[R15]: https://docs.gorgias.com/en-US/how-to-use-gorgias-a-quick-start-guide-5705504
[R16]: https://docs.gorgias.com/en-US/manage-views-and-sections-in-gorgias-207768
[R17]: https://vercel.com/changelog/dashboard-navigation-redesign-rollout
[R18]: https://docs.stripe.com/dashboard/search
[R19]: https://supabase.com/blog/tabs-dashboard-updates
[R20]: https://resend.com/products/transactional-emails
[R21]: https://www.resend.com/changelog/improved-logs-visibility
[R22]: https://docs.railway.com/projects
[R23]: https://clerk.com/changelog/2025-05-28-redesigned-dashboard-overview
[R24]: https://clerk.com/changelog/2025-11-06-command-menu
[R25]: https://docs.retool.com/build/apps/concepts/app-builder
[R26]: https://docs.retool.com/classic-apps/guides/layout-structure/frames
[R27]: https://docs.sentry.io/product/issues/issue-details/?promo_name=hp-banner
[R28]: https://sentry.io/changelog/new-issue-details-ui-now-available/
[R29]: https://www.notion.com/help/navigate-with-the-sidebar
[R30]: https://www.notion.com/help/views-filters-and-sorts
[R31]: https://help.coda.io/hc/en-us/articles/39555740044941-Customize-row-layouts
[R32]: https://help.coda.io/hc/en-us/articles/39555863271053-Coda-mobile-app-basics
[R33]: https://resources.arc.net/hc/en-us/articles/19228064149143-Spaces-Distinct-Browsing-Areas
[R34]: https://start.arc.net/find-focus
[R35]: https://developers.raycast.com/api-reference/user-interface/action-panel
[R36]: https://www.raycast.com/blog/a-fresh-look-and-feel
[R37]: https://slack.com/help/articles/212596808-Adjust-your-sidebar-preferences
[R38]: https://slack.com/help/articles/29788684062739-Customize-the-Slack-mobile-app/
[R39]: https://support.airtable.com/articles/5805061650-airtable-interface-layout-record-detail
[R40]: https://support.airtable.com/articles/9609457174-airtable-desktop-and-mobile-feature-differences
[R41]: https://help.granola.ai/article/ai-enhanced-notes
[R42]: https://www.granola.ai/
[R43]: https://prod.cursor.com/help/ai-features/agent
[R44]: https://docs.cursor.com/en/agent/review
[R45]: https://www.notion.com/help/custom-agents
[R46]: https://www.notion.com/help/best-practices-for-creating-and-optimizing-a-custom-agent
[R47]: https://dust.tt/blog/how-to-develop-an-llm-agent
[R48]: https://docs.dust.tt/changelog/introducing-sidekick-your-ai-assistant-for-building-better-agents
[R49]: https://height.app
[M01]: https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview
[M02]: https://motion.dev/docs/react-reduce-bundle-size
[M03]: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
[M04]: https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element
[T01]: https://rsms.me/inter/
[T02]: https://github.com/productiontype/Newsreader