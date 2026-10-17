# Avenlyo frontend wireframes v1

Proposed direction: **B — The Front Office**. Research date: 17 October 2026. Audited branch: `feat/frontend-recreation-v1`, baseline `ed945629cfe04b7097c6a94e8699603f2b9b5792`.

Read alongside [the research and experience specification](frontend-research-v1.md). These are text wireframes requested for design review, not implemented UI. All names, messages, counts and dates represented by brackets are placeholders; no live customer data, metrics or screen captures are implied. Boxes indicate regions and relationships, **not a requirement to draw a visible card border**.

Notation: `[Action]` = control; `(disabled)` = unavailable; `>` = selected destination/row; `...` = disclosure; `N` = a count from a successful query; `--` = unavailable data, never zero. All ASCII dimensions are schematic. Pixel measurements in the research spec take precedence.

## 1. Shared frame

Desktop ≥1024px: one 208px sand sidebar; white/sand content plane. Six destinations in two groups. The work area has a single title/toolbar, not a duplicate global header plus large hero. Sidebar icon names below are labels, not suggested literal icon artwork.

```text
208px                  Remaining viewport
+--------------------+------------------------------------------------------+
| Avenlyo            | Current page / compact toolbar                       |
| [Business name  v] |                                                      |
|                    | Working content                                      |
| > Home             |                                                      |
|   Inbox            |                                                      |
|   Leads            |                                                      |
|                    |                                                      |
| SETUP              |                                                      |
|   Agent            |                                                      |
|   Knowledge        |                                                      |
|   Channels         |                                                      |
|                    |                                                      |
|                    |                                                      |
| Settings           |                                                      |
+--------------------+------------------------------------------------------+
```

Workspace control exposes current business, switch/manage workspaces, role and Sign out. Switching remains an explicit existing form action; no tenant context is inferred from the page URL. At 768–1023px use a 72px compact navigation rail and a single list/detail work area.

Mobile <768px:

```text
+--------------------------------------+
| Avenlyo   [Business name v]    [Menu] |
+--------------------------------------+
| Current page                         |
|                                      |
| Content                              |
|                                      |
+--------------------------------------+
| [Home]  [Inbox]  [Leads]  [Menu]      |
|          safe-area padding           |
+--------------------------------------+
```

Bottom bar is 64px plus safe area; header 56px. In an open thread, composer replaces bottom navigation; Back and header Menu remain. Menu sheet lists Agent, Knowledge, Channels, Settings, Manage workspaces, Sign out. An active destination has readable text, icon and surface treatment. No counts suggest unread state.

## 2. Home — business brief

### Desktop: real work present

1120px maximum content width; 32px page gutters. The sidebar is omitted from some later diagrams for readability but remains present on desktop.

```text
+--------------------+------------------------------------------------------+
| Avenlyo            | [Business name]                                      |
| [Workspace v]      | Your AI front office                  [Open Inbox]   |
|                    |                                                      |
| > Home             | CONVERSATIONS WITH AI PAUSED              READINESS  |
|   Inbox            | N real conversations                      ---------- |
|   Leads            | --------------------------------------    Saved      |
|                    | [Customer reference]     [activity]       behavior   |
| SETUP              | Website Chat / Unclaimed                  [Agent]    |
|   Agent            | [Open conversation]                                  |
|   Knowledge        | --------------------------------------    N published|
|   Channels         | [Customer reference]     [activity]       items      |
|                    | Instagram / Claimed by you                [Knowledge]|
|                    | [Open conversation]                                  |
|                    | --------------------------------------    Website    |
|                    | Up to five rows, not an unread queue      Ready      |
|                    | [Open Inbox]                              [Channels] |
|                    |                                                      |
|                    | RECENT REAL CONVERSATIONS                 Instagram  |
|                    | [Customer] / [preview] / [activity]        [state]    |
|                    | [Customer] / [preview] / [activity]        [Channels] |
| Settings           |                                                      |
+--------------------+------------------------------------------------------+
```

The paused section uses a separate existing member-scoped conversation read/count, excluding tests. Recent preview rows come from the snapshot and are explicitly recent. No accumulated event feed or fabricated alert severity. If recent rows repeat everything above, omit that secondary section.

### Desktop: no real work / setup needed

```text
Your AI front office

Prepare your front office                 Answering facts
--------------------------------------    ------------------------------
Publish the facts customers ask about.     Published items     0
                                          Website Chat        Disabled
[Add knowledge]                           Instagram           Not configured

Then try a customer question and           Saved behavior      [View Agent]
configure a supported channel.             [Test agent]

No customer conversations yet.
[Channels]
```

This is conditional emphasis on a truthful dependency, not an onboarding completion score. The diagram's `0` is the successful empty-state example; fetch failure displays Unavailable.

### Mobile

```text
+--------------------------------------+
| Avenlyo   [Business v]         [Menu] |
+--------------------------------------+
| Your AI front office                 |
|                                      |
| Conversations with AI paused      N  |
| ------------------------------------ |
| [Customer reference]      [activity] |
| Website Chat / Unclaimed             |
| [Open conversation]                  |
| ------------------------------------ |
| [Customer reference]      [activity] |
| Instagram / Claimed by you           |
| [Open conversation]                  |
|                                      |
| [Open Inbox]                         |
|                                      |
| Answering readiness                  |
| N published items       [Knowledge]  |
| Website [state]         [Channels]   |
| Instagram [state]       [Channels]   |
| Saved behavior          [Agent]      |
| [Test agent]                         |
+--------------------------------------+
| [Home]  [Inbox]  [Leads]  [Menu]      |
+--------------------------------------+
```

Loading: row/ledger skeletons matching this composition. Partial failure: replace only the failed section with “Unavailable / Retry.” No zero or all-caught-up message on failure. Motion: simple hover/focus; no animated counts.

## 3. Inbox — master-detail with optional context

### Wide desktop ≥1440px, context deliberately opened

The app navigation plus three work regions should not be called four independent navigation systems. Context is optional, not empty reserved space. At 1440px: 208 + 320 + 632 + 280.

```text
208px              320px                    flexible             280px
+------------------+-------------------------+--------------------+------------------+
| Avenlyo          | Inbox         [Refresh] | [Customer name]    | Context      [X] |
| [Business v]     | Recent / real customers | Website Chat       |                  |
|                  +-------------------------+--------------------+------------------+
| Home             | > [Customer] [activity] | Needs human /      | Customer channel |
| > Inbox          |   [latest preview ...]  | AI paused          | reference        |
| Leads            |   Website / Unclaimed   | Unclaimed          | [reference]      |
|                  |                         | [Claim conversation]|                 |
| SETUP            | [Customer]   [activity] +--------------------+ Linked lead      |
| Agent            | [latest preview ...]    | [Earlier messages] | [name]           |
| Knowledge        | Instagram / Claimed     |                    | [qualification]  |
| Channels         | by you                  | Customer    [time] | [View linked     |
|                  |                         | [message text]     |  lead ->]        |
|                  | [Customer]   [activity] |                    |                  |
|                  | [latest preview ...]    |   Avenlyo AI [time]| Ownership        |
|                  | AI active               |   [answer text]    | Unclaimed        |
|                  | Delivery issue recorded|   [delivery state] |                  |
|                  |                         |                    | Staff email      |
|                  |                         | Customer    [time] | [kind / status]  |
|                  |                         | [human request]    |                  |
|                  |                         |                    |                  |
|                  |                         +--------------------+                  |
|                  |                         | Your human reply   |                  |
|                  |                         | (disabled)         |                  |
|                  |                         | Claim to reply.    |                  |
| Settings         | [Previous]  [Next]      | [Send] (disabled)  |                  |
+------------------+-------------------------+--------------------+------------------+
```

Primary action before claim sits in handling strip; after successful claim it becomes the composer Send. The research spec retains the full tested label `Send human reply`; shortened diagrams do not authorize changing that accessible name.

### Standard desktop 1024–1439px, default context closed

```text
+------------------+-------------------------+---------------------------------------+
| App navigation   | Inbox         [Refresh] | [Customer]  Website Chat    [Context] |
| 208px            | Recent                  +---------------------------------------+
|                  |                         | Needs human / AI paused               |
|                  | > [Selected customer]   | Claimed by you          [Actions ...] |
|                  |   [preview]             +---------------------------------------+
|                  |   Claimed by you        | Customer                       [time] |
|                  |                         | [Customer message]                    |
|                  | [Other customer]        |                                       |
|                  | [preview]               |                 Avenlyo / AI   [time] |
|                  | AI active               |                 [Saved answer]        |
|                  |                         |                 [Delivery state]      |
|                  |                         |                                       |
|                  |                         |              Team / human reply [time]|
|                  |                         |              [Your persisted reply]   |
|                  |                         +---------------------------------------+
|                  |                         | Your human reply                      |
|                  |                         | [Text input                         ] |
|                  |                         | [                                   ] |
|                  |                         | Reply appears in visitor chat.        |
|                  | [Previous] [Next]       |               [Send human reply]      |
+------------------+-------------------------+---------------------------------------+
```

Context button opens a 280–320px overlay drawer with Close, not a permanently squeezed third work pane. Actions disclosure includes Release conversation and Resume AI with consequences visible. No assignment picker or Resolve action.

### Mobile list

```text
+--------------------------------------+
| Avenlyo   [Business v]         [Menu] |
+--------------------------------------+
| Inbox                     [Refresh] |
| Recent real conversations            |
| ------------------------------------ |
| [Customer reference]       [activity]|
| [Latest preview, up to two lines...]  |
| Website Chat / AI paused / Unclaimed |
| ------------------------------------ |
| [Customer reference]       [activity]|
| [Latest preview ...]                 |
| Instagram / Claimed by you           |
| Delivery issue recorded              |
| ------------------------------------ |
| [Customer reference]       [activity]|
| [Latest preview ...]                 |
| Website Chat / AI active             |
|                                      |
| [Previous]       [Next 50]            |
+--------------------------------------+
| [Home]  [Inbox]  [Leads]  [Menu]      |
+--------------------------------------+
```

No filter chips that act only on the current page. Selected row tint/rule does not imply unread. On return, restore page/scroll rather than starting the list over.

### Mobile conversation, claimed by you

```text
+--------------------------------------+
| [Back] [Customer]  [Context]  [Menu] |
|        Website Chat                  |
+--------------------------------------+
| Needs human / AI paused              |
| Claimed by you            [Actions]  |
+--------------------------------------+
| [Load earlier messages]              |
|                                      |
| Customer                      [time] |
| [message text]                       |
|                                      |
|                 Avenlyo / AI  [time] |
|                 [answer text]        |
|                 Available to visitor |
|                                      |
|           Team / human reply  [time] |
|           [persisted reply]          |
|                                      |
| [New messages]  <- only while        |
|                    reading history   |
+--------------------------------------+
| Your human reply                     |
| [                                  ]|
| [Text input                        ]|
| [                                  ]|
| [Limit/help]      [Send human reply] |
|          safe-area / keyboard edge   |
+--------------------------------------+
```

Unclaimed variant: disabled input and a 44px Claim conversation action. Other member variant: read-only composer with explanatory text. No name is guessed for another member.

### Critical state overlays (desktop and mobile)

```text
Actions ...
+-----------------------------------------------------+
| Release conversation                                |
| Remove your claim. AI remains paused.                |
|                                                     |
| Resume AI                                           |
| Remove the claim and let AI answer the next          |
| customer message.                                   |
+-----------------------------------------------------+

Unconfirmed human-reply request
+-----------------------------------------------------+
| We could not confirm the reply result.               |
| The submitted message is kept unchanged.             |
| [Inspect latest thread]        [Retry same reply]    |
| Composer locked / new send and resume unavailable    |
+-----------------------------------------------------+

Instagram message (existing persisted delivery)
Team / human reply                              [time]
[message text]
Delivery unconfirmed
Check the channel before a separate follow-up.
Automatic resend stopped.
(No Retry delivery button)
```

Unknown HTTP reply result and unknown provider delivery are different states. The former can check the same saved UUID; the latter has no automatic retransmission control.

Thread loading clears previous customer's content and disables reply. Poll failure keeps useful loaded messages with a stale-state notice. Message arrival follows bottom only when within 80px; history loading preserves viewport. No unread receipts, SLA, presence or fake event timeline.

## 4. Agent — operating brief

### Desktop

```text
+--------------------+------------------------------------------------------+
| Shared navigation  | Agent                                                |
|                    | [Behavior]  [Test Agent]  [Test history]              |
|                    |                                                      |
| > Agent            | How your front office works                          |
|                    |                                                      |
|                    | 01 Help customers                  EFFECTIVE BEHAVIOR |
|                    | --------------------------------   ------------------ |
|                    | [x] Answer customer questions      [Saved / Unsaved] |
|                    |     Published facts only.          Answers from       |
|                    | [x] Identify customer interest     published knowledge|
|                    | [x] Qualify inquiries                                |
|                    | [x] Collect contact details        Requests selected  |
|                    |                                    contact details    |
|                    | 02 Speak in this tone                                 |
|                    | (o) Professional                   Professional tone  |
|                    | ( ) Warm  ( ) Concise                                |
|                    |                                    Human assistance   |
|                    | 03 Ask for these details           always available   |
|                    | [x] Name    [x] Email                                 |
|                    | [ ] Phone   [ ] Company            [Open Knowledge]   |
|                    |                                                      |
|                    | 04 Bring in a person                                  |
|                    | [x] Human handoff (locked on)                         |
|                    | Team explicitly resumes AI.                          |
|                    |                                                      |
|                    | [Planning note ...]                                  |
|                    | Not sent to the answering AI.                        |
|                    |                                                      |
|                    | [Save settings]  [Reset local edits]                 |
|                    | [server response / field issue]                      |
+--------------------+------------------------------------------------------+
```

Expanded note retains tested label `What should Avenlyo help your customers with?` and 1500-character bound. It is not a system prompt. Effective behavior is deterministic from selected controls; no generated example or model call.

### Mobile

```text
+--------------------------------------+
| Avenlyo [Business v]           [Menu] |
+--------------------------------------+
| Agent                                |
| [Behavior] [Test Agent] [History]     |
|                                      |
| How your front office works          |
|                                      |
| 01 Help customers                    |
| [x] Answer customer questions        |
| [x] Identify customer interest       |
| [x] Qualify inquiries                |
| [x] Collect contact details          |
|                                      |
| 02 Tone                              |
| (o) Professional                     |
| ( ) Warm     ( ) Concise              |
|                                      |
| 03 Contact fields                    |
| [x] Name      [x] Email               |
| [ ] Phone     [ ] Company             |
|                                      |
| 04 Human handoff                     |
| [x] Always available (disabled)      |
|                                      |
| [Effective behavior ...]             |
| [Planning note ...]                  |
|                                      |
| [Save settings]                      |
| [response / inline issue]            |
+--------------------------------------+
| [Home]  [Inbox]  [Leads]  [Menu]      |
+--------------------------------------+
```

Member variant is a readable brief with disabled controls and owner-only explanation. Dirty settings are not tested as if saved; tab change can offer save or explain last saved behavior. Loading matches sections, not a generic card dashboard.

### Test Agent secondary surface

```text
[Behavior] [Test Agent] [Test history]

Try a customer conversation                           [New test]
TEST MODE / saved settings / published knowledge
Saved as test data. No external message or staff notification.

+---------------------------------------------+--------------------------+
| [Question] [Service interest] [Human request]| Test outcome             |
| These fill the input; no automatic send.    | No lead yet / linked lead|
|                                             | [View test lead ->]      |
| Test customer                               |                          |
| [message]                                   | [Saved conversation ->] |
|                                             |                          |
| Avenlyo                                      |                          |
| [response]                                  |                          |
|                                             |                          |
| [AI paused notice] [Resume test AI]          |                          |
+---------------------------------------------+--------------------------+
| Customer message                            |
| [input]                             [Send]  |
+---------------------------------------------+
```

On phone, outcome becomes a disclosure above chat. Saved history is a test-only row list; opening a test displays transcript and source titles when available. New test does not erase old saved tests. No human-reply workflow is implied here.

## 5. Knowledge — publication-aware library and editor

### Desktop list

```text
+--------------------+------------------------------------------------------+
| Shared navigation  | Knowledge                            [Add knowledge] |
|                    | Good answers start here                              |
| > Knowledge        | Only published items can be used for answers.        |
|                    |                                                      |
|                    | [All] [Published] [Draft] [Archived]                  |
|                    | ---------------------------------------------------- |
|                    | Type  Title / question           State      Updated  |
|                    | ---------------------------------------------------- |
|                    | Text  [Service description]      Published  [date]   |
|                    |       [two-line excerpt]                             |
|                    |       [Edit item] [Unpublish] [Actions ...]          |
|                    | ---------------------------------------------------- |
|                    | FAQ   [Customer question?]       Draft      [date]   |
|                    |       [answer excerpt]                               |
|                    |       [Edit item] [Publish] [Actions ...]            |
|                    | ---------------------------------------------------- |
|                    | Text  [Document title]           Archived   [date]   |
|                    |       [excerpt]                                      |
|                    |       [Edit item] [Publish] [Delete ...]             |
|                    |                                                      |
|                    | [Draft saved / publication response near item]       |
+--------------------+------------------------------------------------------+
```

This is one continuous list with row dividers, no gallery cards. Owner controls only. Members can read actual item content; don't add an edit control that fails. Delete opens a real consequence confirmation; no Undo is promised.

### Desktop editor at existing item/new route

```text
[Back to Knowledge]

[New knowledge / Edit item]                    [current Draft/Published]

Knowledge type
(o) Text - services and information     ( ) FAQ - question and answer

Title                                 OR Question (for FAQ)
[                                                                    ]

Content                               OR Answer (for FAQ)
[                                                                    ]
[                       document-like editor                         ]
[                                                                    ]
[                                                                    ]

[character count / 6000]
Saving edits returns this item to Draft.
Publish again before the agent can use it.

[Save draft] [Cancel]
[validation / revision-conflict response]
```

### Mobile list and editor

```text
+--------------------------------------+
| Avenlyo [Business v]           [Menu] |
+--------------------------------------+
| Knowledge            [Add knowledge]|
| Only published facts power answers. |
|                                      |
| [All] [Published] [Draft] [Archived]  |
| ------------------------------------ |
| Text / Published                     |
| [Service description]                |
| [excerpt ...]                        |
| [Edit item] [Unpublish] [Actions]     |
| ------------------------------------ |
| FAQ / Draft                          |
| [Question?]                          |
| [answer excerpt ...]                 |
| [Edit item] [Publish] [Actions]       |
+--------------------------------------+
| [Home]  [Inbox]  [Leads]  [Menu]      |
+--------------------------------------+

Editor route
+--------------------------------------+
| [Back] Knowledge                     |
+--------------------------------------+
| [Text] [FAQ]                         |
| Title / Question                     |
| [                                  ]|
| Content / Answer                     |
| [                                  ]|
| [                                  ]|
| [                                  ]|
| [                                  ]|
|                                      |
| Save as Draft, then publish.         |
| [Save draft] [Cancel]                |
+--------------------------------------+
```

Empty All state offers Add knowledge; empty status filter offers All. Initial loading uses row placeholders. Publish failure retains draft; edit conflict retains unsaved text and asks to review current revision. No website importer or “training” meter.

## 6. Channels — availability and installation

### Desktop

```text
+--------------------+------------------------------------------------------+
| Shared navigation  | Meet customers where they are                        |
|                    | Saved behavior + published knowledge power channels. |
| > Channels         |                                                      |
|                    | Website Chat                               [state]   |
|                    | Customer questions on approved websites.             |
|                    | [Configure Website Chat]                             |
|                    | ---------------------------------------------------- |
|                    | Instagram                                  [state]   |
|                    | Supported customer-initiated text messages.          |
|                    | [Inspect account/setup state]                        |
|                    | ---------------------------------------------------- |
|                    | Real conversations appear in Inbox.   [Open Inbox]   |
|                    |                                                      |
+--------------------+------------------------------------------------------+
```

### Website configuration, expanded section/sheet on same Channels surface

```text
Website Chat                                                 [Close]
[Disabled / Ready / Active with past activity]

01 Approved websites
One exact HTTPS origin per line. Include www separately.
[ https://example.com                                             ]
[ https://www.example.com                                         ]
[                                                                ]
No paths or wildcards. Up to ten unique origins.

02 Availability
[x] Enable Website Chat
[Save Website Chat]
[save response]

03 Install (only after the connection record exists)
Website embed                                      [Copy snippet]
+-----------------------------------------------------------------+
| <script ... widget.js ... data-avenlyo-channel="[public ID]">    |
+-----------------------------------------------------------------+
Place before the closing body tag.
[Open local widget demo]  <- local HTTP configuration only

[last recorded activity, when actually available]
Ready does not prove installation is live.
```

### Instagram detail states

```text
Not configured                         Connected
-----------------------------          -----------------------------
Founder-assisted setup                 @[verified provider username]
Professional account, access           Account [provider account ID]
and webhook setup required.            Connected / enabled / verified
Ask your Avenlyo operator.             [Open Inbox]
(No Connect/OAuth button)               [Disconnect Instagram ...]

Needs attention                        Disconnected / managed setup
-----------------------------          -----------------------------
Existing channel needs attention.      Managed reconnection required.
Inspect Inbox delivery details         Historical threads remain in
and contact the operator.              Inbox; new sending unavailable.
(No token refresh button)              (No credential fields)
```

Exact state mapping and owner restrictions are in research section 9.13. UI never exposes tokens or invents a setup-request submission service.

### Mobile

```text
+--------------------------------------+
| Avenlyo [Business v]           [Menu] |
+--------------------------------------+
| Meet customers where they are        |
|                                      |
| Website Chat                 [state] |
| [Configure Website Chat]             |
| ------------------------------------ |
| Instagram                    [state] |
| [Inspect account/setup]              |
|                                      |
| [Open Inbox]                         |
+--------------------------------------+
| [Home]  [Inbox]  [Leads]  [Menu]      |
+--------------------------------------+

Configuration sheet
+--------------------------------------+
| Website Chat                 [Close] |
+--------------------------------------+
| Approved website origins            |
| [https://example.com                ]|
| [https://www.example.com            ]|
| [                                  ]|
|                                      |
| [x] Enable Website Chat              |
| [Save Website Chat]                  |
| [response]                           |
|                                      |
| Website embed          [Copy snippet]|
| [script wraps or scrolls internally] |
| [                                  ]|
+--------------------------------------+
```

Loading never displays a fabricated Disabled state. Clipboard failure leaves selectable code and does not claim Copied. Disabling/removing origins explains the actual session consequence beside that control.

## 7. Leads — inquiry ledger

### Desktop list

```text
+--------------------+------------------------------------------------------+
| Shared navigation  | Leads                                                |
|                    | Customer-stated service inquiries                    |
| > Leads            |                                                      |
|                    | [Customer leads] [Test leads]                        |
|                    | [All leads] [Qualified] [Needs info] [Needs human]    |
|                    | ---------------------------------------------------- |
|                    | Contact       Inquiry        Qualification Source    |
|                    | ---------------------------------------------------- |
|                    | [name]        [summary ...]  Qualified     Website   |
|                    | [email/phone]                              [updated] |
|                    | ---------------------------------------------------- |
|                    | [company]     [summary ...]  Needs info    Instagram |
|                    | [contact]                                  [updated] |
|                    | ---------------------------------------------------- |
|                    | [fallback]    [summary ...]  Needs human   Website   |
|                    | Details in progress                        [updated] |
|                    |                                                      |
|                    | Up to 100 loaded records, current scope.              |
+--------------------+------------------------------------------------------+
```

Desktop actual columns may separate Updated as specified. No New column: every stored lead has the same current status. No pipeline, scores or actions pretending to send outreach.

### Desktop detail

```text
[Back to Leads / preserved scope]

[Name or company or Service inquiry]             [View conversation]
[Website Chat / Instagram / Test Agent]
Customer-stated details; not verified identity.

Inquiry summary                              Contact details
------------------------------------         -------------------------
[stored summary text]                        Name      [value / absent]
[                                  ]         Email     [value / absent]
[                                  ]         Phone     [value / absent]
                                             Company   [value / absent]
Qualification    [actual stored value]
Source           [actual stored source]

Source action opens Inbox for real customer, test history for Test Agent.
```

### Mobile

```text
+--------------------------------------+
| Avenlyo [Business v]           [Menu] |
+--------------------------------------+
| Leads                                |
| [Customer leads] [Test leads]        |
| [Qualification filter]               |
| ------------------------------------ |
| [Name / company]                     |
| [email or phone]                     |
| [summary excerpt]                    |
| Qualified / Website Chat / [date]    |
| ------------------------------------ |
| [Name / fallback]                    |
| [contact details in progress]        |
| [summary excerpt]                    |
| Needs info / Instagram / [date]      |
+--------------------------------------+
| [Home]  [Inbox]  [Leads]  [Menu]      |
+--------------------------------------+

Detail route
+--------------------------------------+
| [Back] Lead                   [Menu] |
+--------------------------------------+
| [Name / company]                     |
| [Source] / [Qualification]           |
| [View conversation]                  |
|                                      |
| Inquiry summary                      |
| [stored summary]                     |
|                                      |
| Contact details                      |
| Name       [value / Not provided]    |
| Email      [value / Not provided]    |
| Phone      [value / Not provided]    |
| Company    [value / Not provided]    |
|                                      |
| Customer-stated; not verified.       |
+--------------------------------------+
```

Loading matches list/detail structure. Customer-scope empty state routes toward Channels/Inbox; test scope can suggest testing. A known qualification state is not manually editable.

## 8. Website Chat widget

### Desktop, on an unrelated business website

Keep the host website usable. The widget owns only its isolated launcher/panel. Desktop panel is non-modal; no full-screen dimming or focus trap.

```text
BUSINESS WEBSITE

                                      376px
                      +--------------------------------------+
                      | [Business name]             [Close] |
                      | AI assistance by Avenlyo             |
                      +--------------------------------------+
                      | Ask about this business.             |
                      +--------------------------------------+
                      | [Load earlier messages]              |
                      |                                      |
                      | Avenlyo                              |
                      | [saved AI answer]                    |
                      |                                      |
                      |                            You       |
                      |               [customer message]     |
                      |                                      |
                      | Team                                 |
                      | [saved human reply]                  |
                      +--------------------------------------+
                      | Your message                         |
                      | [                                  ]|
                      | [                                  ]|
                      | Powered by Avenlyo          [Send]   |
                      | [error / retry explanation if any]   |
                      +--------------------------------------+

                                          [Chat with us]
```

Header uses business name returned by public session/thread API. Before that response, use generic Business chat; no name guessed from host domain. Actual response is not streamed. Send/closing stays familiar; safe retry identity/session behavior is unchanged.

### Mobile, opened panel

≤600px, 8px inset and near-full available height, respecting safe areas and virtual keyboard. Launcher hidden while panel is open. If mobile uses modal semantics, implement focus containment and host inertness only while open.

```text
+--------------------------------------+
| [Business name]              [Close] |
| AI assistance by Avenlyo             |
+--------------------------------------+
| A team member can continue.          |
| Automated answers are paused.        |
+--------------------------------------+
|                                      |
| Avenlyo                              |
| [persisted answer]                   |
|                                      |
|                               You    |
|                   [human request]    |
|                                      |
| Team                                 |
| [persisted human reply]              |
|                                      |
+--------------------------------------+
| Your message                         |
| [                                  ]|
| [                                  ]|
| Powered by Avenlyo           [Send]  |
|          safe-area / keyboard edge   |
+--------------------------------------+
```

AI-paused status does not claim a team member is online, assigned, notified or about to reply. Human names are not supplied by the public message payload; label Team.

### Widget empty, pending and unavailable states

```text
Empty:     Hello. Ask a question or tell us what you are looking for.
           (Welcome text, not an invented saved message)

Opening:   Opening your conversation...
Pending:   Preparing a response... / Working...
           (No synthetic typing dots implying provider activity)

Unconfirmed request:
           Connection interrupted. Retry the same message safely.
           [submitted text, locked]     [Retry same message]

Unavailable session:
           This chat session is unavailable.
           [Start a new chat]
           (Existing restart action; no automatic credential recovery claim)
```

Open/close 240/150ms; confirmed new messages 150ms; reduced motion immediate. Earlier history loads without animation. No appointment actions, contact-capture form, attachments, staff photos or read receipts.

## 9. Auth, first workspace and Settings supplements

```text
AUTH (desktop max 400px; same structure on mobile)

Avenlyo
Start with your business                 (signup tested heading)
Email        [                              ]
Password     [                              ]
[response / confirmation instructions]
[Create account]
Already have an account? [Sign in]

FIRST WORKSPACE (max 480px)

Avenlyo                                    [Sign out]
Your workspaces
[Existing business]                        (if available)

Create a workspace
Business name [                             ]
No website required.
[Create workspace]

SETTINGS (max 680px; single column mobile)

Workspace settings
Business name [                             ]
[Save changes]
-----------------------------------------------------
Your role      [owner/member]
Created        [date]
[Workspace ID ...]                         selectable
```

There is no social sign-in, password recovery, staff invitation, billing or notification-settings placeholder. Errors preserve input and remain visible. A member's Settings name is read-only.

## 10. Review checklist for the later implementation

These wireframes intentionally show only existing data/actions and frontend presentation proposals. Review against the detailed specification before writing code:

- Desktop 1024/1440 and mobile 320/390/768: no page overflow, comfortable message measure, reachable 44px mobile actions.
- Preserve current direct URLs, form names, test accessible labels, widget role markers and private workspace boundaries.
- No current-page-only filter masquerading as a global Inbox queue; no unread state, delivery retry or Resolve action.
- Test data is visible only under explicit testing scope; a test lead cannot look like a real customer lead.
- State changes require server confirmation; release stays paused, resume applies to next input, claim can change lead qualification.
- Unknown send result preserves exact content/UUID; provider unknown is not automatically retransmitted.
- Empty/loading/error/permission/stale states use the same composition, not unrelated dashboard placeholders.
- Reduced motion retains meaning; focus and keyboard work through sheets, dialogs, message history, workspace switching and widget close.

**Research stop:** do not implement these screens until the user explicitly approves a direction and implementation scope.