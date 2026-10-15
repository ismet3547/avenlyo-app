# Channels & Handoff V1

This milestone extends the merged independent Foundation. Test Agent, Website Chat and Instagram authenticate differently, then use **one `FrontOfficeRuntime`** and the same published knowledge, structured settings, customer-evidence validation and atomic lead commit. No legacy integration, hosted database change or deployment is part of the work.

## Website pilot

1. Configure Agent goals/contact fields and publish Text/FAQ knowledge.
2. In Channels, add exact approved origins (including each www variant), enable Website Chat and save.
3. Copy the supplied script into the business website before its closing body tag. Configure `AVENLYO_PUBLIC_API_URL` to the externally reachable HTTPS Fastify origin for a live website. Local demo uses `http://localhost:4001` and explicitly approved `http://localhost:3001`.
4. The anonymous visitor opens the widget. Their browser receives a 256-bit credential; only its SHA-256 hash is stored. The session is scoped to connection, workspace, conversation, exact Origin and seven-day expiry. Public routes never accept workspace authority.
5. Incoming messages use client UUIDs. Completed retries replay the same saved turn; an unconfirmed widget request retains its UUID. Polling reads only the session's thread, including human replies. Earlier messages can be loaded.

Disabled channels, removed origins and expired sessions stop public access immediately. An opaque public channel UUID is an installation identifier, not a bearer secret or authenticated workspace identity. Origin protects the browser boundary; it cannot authenticate a non-browser caller. Public knowledge is deliberately used for customer answers.

## Inbox and handoff

Inbox lists real channel threads with preview, customer reference, channel, linked lead state, human ownership and activity. Test Agent stays separate. Detail loads the complete thread through cursor pagination and polls recent messages. Every read is current-member scoped.

Hard handoff is server controlled: explicit human request, missing published facts, disabled answering or a closed provider reply window. AI pauses. Already paused follow-ups are stored without another assistant reply or model call. Model `request_human` remains advisory and cannot pause a grounded answerable inquiry.

Claim keeps AI paused. Only the claim owner can send a new human reply; it is stored as `human`. Release keeps AI paused. Resume is an explicit team action and cannot override another active member's claim. Current membership is checked again for every operation. An in-flight model result is suppressed if human ownership/state changed before commit.

Website human replies become available in the visitor thread. Instagram messages enter a unique delivery record before a single provider attempt. `sent` means accepted by Instagram; it is not a read/delivery guarantee. Failed, blocked and unknown outcomes appear in Inbox. Unknown sends are never automatically retried. A provider call already in flight cannot be recalled after a later team action.

## Internal staff email

Only real-channel first qualification and first human-assistance transition enqueue notifications. There is one ledger row per conversation/kind. The recipient is the first **active owner with a confirmed Auth email**, selected by membership creation time/user ID at claim time. No visitor, model, contact lead or browser field selects a recipient. Test Agent produces no notification record.

Resend sends a short plain-text Inbox link without customer message bodies. The unique ledger ID is also the provider idempotency key. A missing provider or rejected request records failure; a timeout/unconfirmed response records unknown. These states never roll back a customer message, lead or pause. `sent` means email-provider acceptance, not mailbox delivery. No verified owner produces `suppressed`.

## Runtime and operations

Instagram webhooks acknowledge after supported signed text events are persisted; the API's small two-second drain normalizes them into the existing runtime. This is a channel-specific event ledger, not a workflow/job platform. Website turns run directly. Production API must remain running for pending Instagram deliveries/notifications.

One processing run per conversation prevents concurrent AI turns. Stalled channel runs close after two minutes and need human attention. Interrupted sends close as unknown after one minute. None is blindly replayed against an external provider. Changing settings/knowledge still follows Foundation source revision checks.

Website uses per-instance IP rate limits plus a durable twenty-new-turns/minute session bound. Session creation is ten/IP/minute, messages twenty-five/IP/minute, thread reads 120/IP/minute. A multi-instance/high-traffic deployment should add shared ingress budgets; no such infrastructure is introduced for the first pilot.

## Deliberate limits

Supported Instagram events are customer text DMs only. No attachments, group inbox, comment/private-reply flow, ad-special windows, Human Agent extension, self-service OAuth or automatic token refresh. Reconnect the same verified account through the operator CLI; V1 does not reassign a workspace's historical Instagram connection to another account.

No billing, subscriptions, appointments, CRM, workflow builder, multi-agent routing, campaigns, customer marketing email, Voice/SMS, WhatsApp, TikTok or old application subsystem. Website importer remains a future feature. Provider prerequisites and live test are in [managed setup](instagram-managed-setup.md); authorization/delivery review is in [security review](channels-handoff-security-review.md).

## Verification

The deterministic CI suite covers 91 unit tests, 161 pgTAP database assertions (71 Foundation + 90 Channels), 41 Foundation acceptance assertions and 88 channel acceptance assertions. The populated upgrade preserves the original fields of three existing Test Agent conversations and one lead. Two Chromium browser flows cover Foundation and anonymous Website Chat/Inbox handoff on desktop and mobile; screenshots are inspected after real page content loads. Typecheck, lint/independence, production builds and the plain-Node API artifact smoke are also required.

Acceptance uses real disposable Supabase Auth, PostgreSQL, RLS and the application API with fake OpenAI, Instagram and email interfaces. These checks do not prove live Meta/Resend eligibility or delivery; the manual provider prerequisites remain explicit.
