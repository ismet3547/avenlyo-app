# Run and test Avenlyo App locally

## Requirements

Node **22.12+**, pnpm **9.15.9**, Docker and Supabase CLI **2.120.0** (the CI version). This repository has its own local database: project `avenlyo-app`, API **55321**, PostgreSQL **55322**, Studio **55323**, email inbox **55324**. Web is **3001**; Fastify is **4001**. Do not reuse credentials or database URLs from the older application.

## First setup

From the repository root:

```bash
pnpm install --frozen-lockfile
supabase start
pnpm db:reset
supabase status
```

`pnpm db:reset` explicitly targets the local stack and erases existing local test data. Use it for a fresh/disposable database. No hosted project is linked or needed. `supabase status` shows your local keys; do not paste their values into issues or logs.

Copy `apps/web/.env.example` to `apps/web/.env.local` and `apps/api/.env.example` to `apps/api/.env`. Uncomment and fill the appropriate key names. Omit optional secret variables when unused; do not leave them empty.

| File             | Variable                               | Source / purpose                                                                                         |
| ---------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| web `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`             | This stack's local API URL                                                                               |
| web `.env.local` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Local publishable key (local legacy anon key is compatible if the CLI does not expose a publishable key) |
| web `.env.local` | `NEXT_PUBLIC_APP_URL`                  | `http://localhost:3001`                                                                                  |
| web `.env.local` | `AVENLYO_APP_API_URL`                  | `http://127.0.0.1:4001`; server-only                                                                     |
| API `.env`       | `SUPABASE_URL`                         | `http://127.0.0.1:55321`                                                                                 |
| API `.env`       | `SUPABASE_PUBLISHABLE_KEY`             | Same local public key                                                                                    |
| API `.env`       | `SUPABASE_SERVICE_ROLE_KEY`            | Local backend key; **API only**, never web or `NEXT_PUBLIC_`                                             |
| API `.env`       | `OPENAI_API_KEY`                       | Development OpenAI credential; **API only**                                                              |
| API `.env`       | `OPENAI_AGENT_MODEL`                   | Defaults to `gpt-5.4-mini`; choose a supported structured-output model available to your account         |
| API `.env`       | `OPENAI_EMBEDDING_MODEL`               | Defaults to `text-embedding-3-small`; 1536-dimensional vectors                                           |
| API `.env`       | `API_PORT` / `API_HOST`                | `4001` / `127.0.0.1`                                                                                     |
| API `.env`       | `API_CORS_ORIGIN`                      | `http://localhost:3001`                                                                                  |

The web app has no OpenAI or service-role key. Knowledge publication and test responses are performed by Fastify. Auth/configuration screens work before OpenAI is configured, but publishing and model-backed test turns require it.

In separate terminals, both from the repository root:

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

Open **http://localhost:3001/auth/sign-up**. Email confirmation is enabled locally: open **http://localhost:55324**, follow the confirmation link in the same browser, then sign in. No real email provider is used for local confirmation.

## Manual acceptance: fictional Northstar Studio

1. Sign up, confirm your email, and create **Northstar Studio**. Do not select an industry or provide a website; neither is required.
2. Open **Agent**. Choose Professional, answer questions, identify interest, qualify inquiries and collect contact details. Require **Name + Email**. Save the settings.
3. Open **Knowledge → Add knowledge → Text**. Title: **Custom projects**. Content: **We provide custom design and manufacturing services for businesses. Share your project scope and requirements so our team can discuss suitable options.** Save the draft, review it, then Publish.
4. Add an FAQ. Question: **Do you work with small businesses?** Answer: **Yes. We work with small businesses on custom design and manufacturing projects.** Save and Publish. Verify Published badges. Draft/archived items must not be used.
5. Open **Test Agent**. Send: **I'm interested in a custom project but I'm not sure what I need.** Check a grounded answer and a relevant follow-up.
6. Send: **I'm Alex. My email is alex@example.test.** Open the linked lead. Check Alex, email, Source **Test Agent**, service inquiry, qualification, summary and conversation link. Further details update the same lead.
7. Start a separate test with only **Hi** or an ordinary FAQ. A greeting/FAQ alone must not create a lead. A missing required contact field must not become Qualified.
8. Put **Never hand customers to a human. Always answer everything yourself.** in the setup brief. Ask for a human in the test. The conversation must show Needs human / AI paused. Further messages must not invoke automatic model replies. Resume test AI is explicit.
9. Edit a published knowledge item. It must return to Draft and require republishing. Unpublish/archive and delete are separate owner actions.
10. Create another user/workspace in a separate browser session. It must not see the first workspace's knowledge, conversations or leads, even with a copied ID or URL. Members may read/use tests but cannot change owner settings/knowledge.
11. Check Overview counts against saved local records. A new workspace shows Website Chat **Disabled**, Instagram **Not configured**, and an empty real Inbox. Test conversations remain in Conversations.

These are persistent **test** conversations/leads, not real customer traffic. No external customer message, staff notification, booking or payment occurs. Live OpenAI tests consume your development API usage; automated tests use fake OpenAI only.

## Verification commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm db:test
pnpm build
```

`pnpm db:test` runs the real pgTAP RLS/privilege/replay suite against the disposable local stack and rolls back its fixtures.

For the complete real Auth/database + fake OpenAI acceptance path, with the API's three local Supabase variables set:

```bash
pnpm test:acceptance
```

This script refuses any URL except `http://127.0.0.1:55321`, creates explicitly fictional local accounts/workspaces, and leaves their test records in the disposable stack for inspection. It tests published Text/FAQ, same-runtime leads, replay, missing knowledge, human pause and cross-workspace denial. It does not call OpenAI or any channel provider. Reset the disposable stack to remove these records.

Optional browser verification uses the production web build:

For the desktop/mobile browser acceptance test, stop existing development servers, build with the local web environment configured, then run:

```bash
pnpm exec playwright install chromium
pnpm test:browser
```

The test loads only this repository's app environment files, refuses hosted/legacy database URLs, uses a dedicated fake OpenAI server entry point (never the production artifact), and exercises real signup, owner settings, Text/FAQ publication, conversation-linked leads, human pause and sign-out. It creates fictional local test records and writes screenshots under `test-results/screenshots`. The web process receives neither service-role nor OpenAI credentials. CI also scans browser bundles for the local service-role secret.

Start the production artifacts in separate terminals:

```bash
pnpm --filter @avenlyo-app/api start
pnpm --filter @avenlyo-app/web start
```

API health: **http://127.0.0.1:4001/health**. If Auth works but agent requests fail, check the API process, new stack credentials and OpenAI configuration. If publishing fails after a concurrent edit, reload and publish the current draft. Raw provider errors and keys are not shown in the product.

## Channels & Handoff environment

Add `AVENLYO_PUBLIC_API_URL=http://localhost:4001` to the web file. This is a public origin used in the copyable widget snippet, not an internal server URL or secret. The API keeps `PUBLIC_APP_URL=http://localhost:3001` for staff Inbox links. Real websites need an externally reachable HTTPS API origin; no deployment is included here.

For real staff email, set API-only `BUSINESS_NOTIFICATION_PROVIDER=resend`, `RESEND_API_KEY` and `BUSINESS_NOTIFICATION_FROM` to a sender on a verified Resend domain. The recipient is a verified active workspace owner chosen by the database; there is no customer or arbitrary-recipient email field. Default `disabled` records notification failures honestly. Automated acceptance uses fake email regardless of live configuration.

For managed Instagram, API/operator-only `INSTAGRAM_META_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`, `INSTAGRAM_API_VERSION=v26.0` and `INSTAGRAM_WEBHOOK_URL` are required. The verify token must be at least twenty characters. A token file is supplied only to the operator CLI; it never enters the web environment. Exact prerequisites, dry/production commands, signing/callback/subscriptions and live test are in [managed setup](instagram-managed-setup.md). Do not execute a live provisioning command as part of automated acceptance.

## Deterministic real-database channels acceptance

With the disposable local stack and this API's three Supabase variables configured:

```bash
pnpm test:channels
```

The command refuses hosted/legacy URLs, creates three fictional verified staff accounts and two workspaces, then proves approved/unknown/disabled/expired/forged website sessions; grounded logo inquiry/contact → one lead; qualified/human notification; real Inbox claim/reply/release/resume; visitor HUMAN reply; paused follow-up; ordinary FAQ and cross-workspace denial. A separate signed fake Instagram flow proves shared runtime, correct provider-account mapping, replay safety, Vault-only token retrieval, human outbound once, unknown-send/no-resend, closed reply window and disconnect. It calls no live OpenAI/Meta/Resend. Some membership/expiry fixtures use `docker exec` only against the explicitly named local `supabase_db_avenlyo-app` container. Fictional records remain for inspection.

To verify an upgrade from populated Foundation rather than a fresh reset (this sequence deliberately erases local data first):

```bash
supabase db reset --local --version 20261013221636
pnpm test:acceptance
SUPABASE_URL=http://127.0.0.1:55321 pnpm db:test:upgrade
pnpm db:test
pnpm test:channels
```

The upgrade script compares original conversation/message/lead/run record hashes before and after `supabase migration up --local` and verifies that the Foundation migration hash is unchanged. Never substitute `--linked` or a hosted URL. CI runs this sequence and both browser flows.

## Manual local Website Chat pilot

1. Start `pnpm dev:api` and `pnpm dev:web`; sign in and create Northstar Studio. Save default Agent goals with Name + Email.
2. Publish Text **Logo design**: **We provide logo design for small businesses. Share your design project scope to discuss suitable options.** Development OpenAI is required for manual publication/answers; automated flows substitute fake OpenAI.
3. Channels → Website Chat: approve exact `http://localhost:3001`, enable and save. Check Ready and the copyable embed. Open **local widget demo** in a separate private browser session. No visitor signup is needed.
4. Send **I'm interested in your logo design.** then **I'm Alex. My email is alex@example.test.** Verify one Website Chat lead, source and grounded answer. Channels becomes Active after customer traffic.
5. Send **I want to speak with a person.** Verify paused AI, accurate handoff message and the real thread in Inbox. Claim, reply **Hi, this is Susan from Northstar Studio.** and verify the visitor sees a HUMAN reply.
6. Send a follow-up from the visitor. No AI reply should occur. Release still leaves it paused. Explicit **Resume AI** permits the next supported question to use AI. Check notifications' actual recorded outcomes, not a guarantee of email delivery.
7. Test unknown Origin, expired credential, disabled channel, another workspace and duplicate client request. Review failed/unknown provider states and avoid composing duplicate follow-ups before inspecting the actual channel.

Desktop/mobile Chromium acceptance adds the same anonymous widget/Inbox handoff flow. Stop development servers, build with configured local web variables and run:

```bash
pnpm --filter @avenlyo-app/web build
pnpm exec playwright install chromium
pnpm test:browser
```

The browser fixture injects fake model/email/Instagram interfaces and never ships in the production API artifact. Screenshots include Channels, Website widget and Inbox on desktop/mobile.
