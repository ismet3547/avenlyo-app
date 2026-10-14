# Avenlyo App

An independent, small AI front office: published business knowledge, useful test conversations, customer-stated contact details, and one linked lead per conversation.

Milestone 1 lives on **`feat/foundation-v1`**. No legacy packages, APIs, database, migrations, billing or industry subsystems are dependencies. No deployment is part of this work.

## Product

- Supabase signup, sign-in, sign-out and multiple workspaces.
- A clean Overview, Agent, Knowledge, Test Agent, Leads, Conversations and Settings.
- Manual Text and FAQ knowledge: draft, edit, publish/unpublish, archive and delete. A website is optional.
- One bounded Fastify/OpenAI runtime, semantic published-only retrieval and persistent test conversations.
- Server-validated contact/lead facts, durable replay, mandatory human assistance and tenant RLS.
- Honest Channels and Inbox future states. **Website Chat and Instagram are not implemented in this milestone.**

## Run locally

Node 22.12+, pnpm 9.15.9, Docker and Supabase CLI 2.120.0.

```bash
pnpm install --frozen-lockfile
supabase start
pnpm db:reset
supabase status
```

Reset erases **local** test data. Copy the app `.env.example` files to `apps/api/.env` and `apps/web/.env.local`, then supply this repository's own local keys. Start in separate terminals:

```bash
pnpm dev:api
pnpm dev:web
```

Open **http://localhost:3001**. Local confirmation mail is at **http://localhost:55324**. API is **4001**; the independent Supabase API is **55321**.

See [exact environment setup and Northstar Studio acceptance](docs/local-development.md), [architecture](docs/architecture.md) and [independence contract](docs/independence-contract.md).

## Verify

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm db:test
pnpm build
```

`pnpm test:acceptance` additionally exercises real local Auth/RLS/database with fake OpenAI. It creates fictional records only in this repository's disposable local stack; see the setup guide. CI runs frozen install, typecheck, lint/independence, unit tests, production build, local Supabase reset/pgTAP and the runtime acceptance flow.

Service-role and OpenAI keys are **API-only**. The web app never uses them. Test records are labeled, and no customer/staff message is sent.
