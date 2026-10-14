# Run and test Foundation V1 locally

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

| File | Variable | Source / purpose |
| --- | --- | --- |
| web `.env.local` | `NEXT_PUBLIC_SUPABASE_URL` | This stack's local API URL |
| web `.env.local` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Local publishable key (local legacy anon key is compatible if the CLI does not expose a publishable key) |
| web `.env.local` | `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` |
| web `.env.local` | `AVENLYO_APP_API_URL` | `http://127.0.0.1:4001`; server-only |
| API `.env` | `SUPABASE_URL` | `http://127.0.0.1:55321` |
| API `.env` | `SUPABASE_PUBLISHABLE_KEY` | Same local public key |
| API `.env` | `SUPABASE_SERVICE_ROLE_KEY` | Local backend key; **API only**, never web or `NEXT_PUBLIC_` |
| API `.env` | `OPENAI_API_KEY` | Development OpenAI credential; **API only** |
| API `.env` | `OPENAI_AGENT_MODEL` | Defaults to `gpt-5.4-mini`; choose a supported structured-output model available to your account |
| API `.env` | `OPENAI_EMBEDDING_MODEL` | Defaults to `text-embedding-3-small`; 1536-dimensional vectors |
| API `.env` | `API_PORT` / `API_HOST` | `4001` / `127.0.0.1` |
| API `.env` | `API_CORS_ORIGIN` | `http://localhost:3001` |

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
11. Check Overview counts against saved local records. Channels must show **Coming next**; Inbox is an honest future-channel empty state.

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

Production artifacts can be started after `pnpm build`:

```bash
pnpm --filter @avenlyo-app/api start
pnpm --filter @avenlyo-app/web start
```

API health: **http://127.0.0.1:4001/health**. If Auth works but agent requests fail, check the API process, new stack credentials and OpenAI configuration. If publishing fails after a concurrent edit, reload and publish the current draft. Raw provider errors and keys are not shown in the product.
