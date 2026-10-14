# Avenlyo App architecture

The pnpm monorepo contains a Next.js web app, a Fastify API and a small shared contract package. No second AI runtime exists.

## Request path

The web app owns cookie sessions using Supabase SSR and verifies them before rendering workspace pages. Every workspace choice is checked against current membership; the cookie is a preference, not authorization. The Next proxy refreshes Auth cookies and sends private/no-store responses. Authentication callbacks have a fixed application redirect.

The browser submits a bounded test message to the same-origin web route. That route checks Origin, validates the body and forwards only a verified access token to the configured new API. Fastify verifies the token against Auth and uses a protected atomic RPC to recheck active membership before claiming a turn. No workspace identity comes from model output or mutable user metadata.

`FrontOfficeRuntime` loads structured goals/tone/contact fields, bounded customer history and published semantic matches. The administrative setup brief is excluded from runtime reads and prompts. OpenAI receives source-controlled instructions and clearly identified reference data, no custom tools or database credentials. Explicit human requests, paused threads and missing knowledge fail conservatively to human assistance. A model-level `request_human` value is advisory only and cannot pause an otherwise grounded, answerable turn; hard handoff authority stays in server-controlled policy. Replies are also scrubbed of unsupported claims that an inquiry was sent, forwarded or notified to a team. This remains the one runtime for Test Agent, Website Chat and Instagram.

## Knowledge

One item is one bounded Text document or FAQ pair. Save/edit creates a draft with no embedding. Publishing computes a 1536-dimensional `text-embedding-3-small` embedding through the API and commits it only if the owner, workspace and item revision are still valid. Retrieval uses pgvector cosine similarity, current membership, published-only rows and a maximum of five matches. Reply persistence rechecks the retrieved revisions. Unpublish/archive clears embeddings; edits require republishing. No crawler, chunk pipeline or website dependency exists.

## Durable turns and leads

`agent_runs` is a small idempotency ledger, not a job framework. The same workspace/actor/request key replays one durable result; changing its content is rejected. Conversation row locking plus one processing-run index prevents concurrent turns. A bounded failed run retains the customer message but cannot invent a completed answer; stale runs are closed after two minutes. A completed result whose network response is lost remains replayable.

Lead proposals pass a strict model schema and server validation. Genuine service/project interest and customer-stated contact evidence are required; a greeting or ordinary FAQ does not qualify. Only selected fields cross the boundary. The backend rechecks current goals, membership, contact evidence, required-field qualification and human state, then persists the assistant reply and one conversation-linked lead atomically. One unique lead per conversation prevents duplicate active records. Lead summaries are bounded customer evidence, not unrestricted generated fields. Test leads never contact customers or trigger email.

## Database boundary

Nine small tables: profiles, workspaces, workspace_members, agent_settings, knowledge_items, conversations, messages, leads, agent_runs. RLS covers every table. Authenticated members have scoped reads; raw DML is revoked. Owner RPCs manage business configuration and knowledge. Four backend RPCs handle publication and turn truth with explicit current-actor checks. Private membership helpers use fixed search paths and explicit grants. Composite workspace/conversation foreign keys prevent cross-workspace links. No Auth-schema trigger is installed.

The service-role key exists only in the Fastify environment. The web app never has or needs it. Request logs discard customer bodies, credentials and query strings; provider errors are reduced to bounded codes. No external provider is called by automated tests.

## Current primary references

- [Supabase SSR/session verification](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16)

Supabase changelog reviewed on 2026-10-14 (Istanbul). The new project uses publishable keys for web/API auth, does not request the anon OpenAPI schema, does not modify Auth schemas, and uses supported TLS clients. No hosted project or deployment was created.

## Channels & Handoff V1

Milestone 2 starts from merged `main` commit `72d891675a9e2f569df0213986a7809f614bd3a1`. The Foundation migration is byte-for-byte unchanged. One additive migration extends channel/source/role/nullable external actor support and adds five small tables: channel_connections, website_sessions, channel_events, message_deliveries and business_notifications. A private credential-reference table points to encrypted Supabase Vault secrets. Existing test records and their original fields survive the upgrade acceptance.

Channel authority is separate from behavior. Test Agent uses fresh Auth/current membership and cannot target real channel threads. Website requests resolve an opaque channel ID plus hashed, origin-bound visitor credential. Instagram verifies the exact signed raw body before parsing, then resolves a provisioned professional account. Neither visitor nor sender is an auth.users row. Public bodies never grant workspace identity.

Every channel uses FrontOfficeRuntime: the same bounded history/settings, published semantic knowledge and validatedLead logic. External run-scoped context/retrieval RPCs avoid granting a public caller team access. Test and external finalization wrappers authorize independently, then call one private atomic commit for evidence, current goals, publication revisions, one lead and durable replay. Administrative brief stays excluded.

Inbox reads active-member scoped real conversations. Claim, reply, release and explicit resume use guarded current-membership RPCs. Human messages have role human and unique actor/conversation/nonce identity. AI remains paused until explicit resume; state versions suppress model results after intervening team changes. Website thread polling reads human replies through only the visitor session.

Instagram text events enter a dedicated durable channel ledger and are drained by the running Fastify process. Message deliveries are claimed before one transport attempt. Pending assistant sends recheck state/window/connection; unconfirmed attempts stop as unknown and need attention. Staff email has its own unique conversation/kind ledger and a verified active owner recipient selected in the database. Failures never undo a customer message/lead/handoff; Test Agent never notifies.

See [channel operation](channels-handoff-v1.md), [current official Meta contract and managed provisioning](instagram-managed-setup.md), and [security review and operational limits](channels-handoff-security-review.md). No production deploy, merge, hosted DB mutation or live provider test is part of this milestone.
