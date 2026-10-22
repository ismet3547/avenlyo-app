# Agent V2

Base: `feat/knowledge-redesign-v1` at `252ba345da591752f5de18e9088bc8a4b0893b9e`.

## Before the migration

Each workspace has one `agent_settings` row. Owner-only `save_agent_settings`
validates bounded tones, goals and contact fields; human handoff is mandatory.
`create_workspace` creates the settings row. Onboarding reads it and persisted
successful test evidence; optional channel completion and Home health are separate.

Test turns use backend-only `begin_agent_turn`, authenticated context reads and
`match_knowledge`. Website sessions and claimed Instagram events create customer
conversations through independently verified channel authority. Channel runtime
loads workspace settings through `channel_runtime_context` and retrieves through
`match_channel_knowledge`. `private.commit_runtime_turn` rechecks publication,
contact evidence, goals, qualification, handoff and conversation state before
writing. Provider, delivery, reply-window and notification boundaries are separate.

Knowledge retrieval is workspace-wide and Published-only. Structured
`runtime_content` is the factual representation. A setup brief is configuration
context, deliberately excluded from model instruction authority.

## Compatibility strategy

Keep `agent_settings` as the initial-agent/onboarding compatibility interface.
Backfill one default Front Office agent per workspace without changing settings,
Knowledge, completion timestamps or history. Bidirectional, change-guarded triggers
keep only this default agent's behavioral settings synchronized. Additional agents
never overwrite onboarding settings. Old migrations remain byte-for-byte intact.

Migrated agents retain legacy multilingual behavior until an owner explicitly
saves language choices. Their valid primary language is English. New agents use
their selected primary language and explicit additional languages. The legacy
policy is internal compatibility state, never a user-selectable detection option.

## Validation

Implementation and checkpoint results are recorded here as work progresses.

## Delivered product model

`/app/agent` is a divider-based Agents library. Each row summarizes name, role,
response languages, Knowledge scope, assigned channels and derived Live / Ready /
Issue status. A never-connected agent is Ready. An actual channel problem is Issue.
There is no Agent Draft/Published lifecycle and no per-agent sidebar entry.

Create Agent is a focused desktop dialog/mobile sheet with name, role and primary
language. Creation uses the existing bounded behavioral defaults. Agent detail is
`/app/agent/{id}` with exactly General, Knowledge and Languages tabs. General uses
focused edits for name, role, style, handling and contacts. Handoff is an immutable
summary, never a checkbox. The old form, configuration preview and promo card have
been removed, including from the development fixture route.

Dialogs retain focus, cycle Tab/Shift+Tab, close with Escape, restore the trigger,
label controls and protect changed edits from accidental dismissal. Knowledge
selection uses search, optional collection filtering, collection-result selection
and item checkboxes inside a focused dialog; the permanent tab shows a summary.
Collection selection resolves to individual item bindings, rather than granting
future items in a collection implicit authority.

## Schema and migrations

New append-only migrations, in order:

1. `20261022162803_agent_v2_foundation.sql`: Agents, item bindings, default backfill,
   compatibility triggers, owner mutations and read RLS.
2. `20261022163746_agent_v2_knowledge_scope.sql`: narrowed published retrieval.
3. `20261022164338_agent_v2_routing.sql`: channel/conversation identity, backfill,
   explicit assignment, agent-specific tests, runtime context and commit checks.
4. `20261022165703_agent_v2_channel_scope_validation.sql`: qualify a PL/pgSQL
   column reference found by full channel/security acceptance.
5. `20261022170109_agent_v2_policy_languages.sql`: canonical translated pause
   notices behind the existing database-enforced handoff policy.

No prior migration was edited. The CLI could not run in this sandbox (the current
binary aborted; an older binary download timed out), so migration filenames use
UTC timestamps. The actual migrations are applied and tested by disposable CI.

`agents` contains UUID identity/workspace, name, role/setup brief, bounded tone,
goals and contact fields, immutable handoff, required primary language, additional
languages, language compatibility policy, Knowledge mode, default marker, creation/
update times and archival time. `(workspace_id,id)` is unique; there is one initial
default per workspace. Names need not be globally unique. Owner-only RPCs validate
all writes. Members can read agents in their workspace. Browser and backend roles
have no direct Agent DML grants. Private helpers have no PUBLIC execution grant.

`agent_knowledge_items` stores workspace, Agent and item IDs with composite
same-workspace foreign keys. `agents.knowledge_mode` is `all` or `selected`. A scope
can narrow access only. Retrieval checks current publication, embedding, workspace,
Agent usability and item binding; final turn persistence independently rechecks
scope and publication revision. Unpublishing/archival removes eligibility
immediately, while bindings remain for later republishing. Hard-deleting a Knowledge
item removes its bindings through the existing item lifecycle.

`channel_connections.agent_id` and `conversations.agent_id` are non-null, indexed,
same-workspace foreign keys. All existing rows backfill to their migrated initial
Agent without changing any original columns, provider state or identifiers.

## Routing and runtime

A new channel uses the sole usable agent automatically. When several exist, setup
requires an explicit selection. Existing setup calls retain the connection's
existing assignment. Website setup gains only a compact Agent selector. Existing
Instagram connections have the same small reassignment control; managed provision
supports `--agent <uuid>` and validates that target before provider operations.
Account, callback, subscription, Vault, reply-window and transport checks remain.

Conversation creation captures the channel's current Agent under a channel lock.
A database trigger prevents later ownership changes. Reassigning a channel affects
new conversations only, including new Instagram customers; an existing Instagram
customer keeps the existing conversation and Agent. One Agent can serve both
supported channel types. Runtime loads the conversation's actual Agent rather
than the first workspace row or an unchecked browser ID.

Test Agent uses `/app/test-agent?agent={id}`, labels the selected Agent, and sends
its ID through the backend validation boundary. Existing conversation IDs must
match that Agent. Test history retains Agent identity and remains readable after
archival. Archived agents cannot start or continue automated turns. Customer
handoff, claim/reply/resume, source evidence and lead qualification still use the
existing durable runtime policy. Role/setup brief remains descriptive context,
not a source of prompt authority; structured behavior and published Knowledge
remain the authority boundaries.

## Languages

New agents select a primary language from the supported 44-language catalog.
Additional choices are unique and cannot duplicate the primary. Replacing primary
is required before removing it. Search keeps the editing interface focused.
For configured agents the provider classifies customer language into the bounded
catalog (or unknown); a supported customer language is used, otherwise the primary
language is used. The same tone, handling, contacts and factual scope apply in
every language. Knowledge is never partitioned or duplicated by language.

Migrated agents have a valid English primary and preserve legacy multilingual
behavior until an owner saves an explicit selection. The language tab explains
this compatibility state. There is no visible Auto detect preference or
per-language persona. Fixed greetings/fallbacks are localized without adding facts.
Database-forced pause messages use private canonical translations; unrecognized
provider text cannot replace the safe pause message. English legacy notice wording
is unchanged. Test notices are explicitly identified as tests.

## Compatibility and limits

Focused onboarding continues to configure the initial/default Agent through its
original RPC. Steps 1–3, successful test evidence, optional Step 4, Set up later and
durable completion are unchanged. No new multi-agent choices appear in onboarding.
Home's Ready/Live/offline semantics and operational lists remain unchanged.
Knowledge remains a workspace library with its existing imports, publication,
revision, archive, restore and deletion behavior. No content copies are created.

Archival preserves historical ownership and never cascades conversation deletion.
Every assigned channel, including a disabled connection, must be reassigned before
archival. The initial Agent is retained for onboarding compatibility and cannot be
archived in this version. Scope selection is bounded to 500 items. Existing
retrieval, file/import and provider limits still apply. Language detection and
answer generation depend on the configured provider; deterministic fixtures test
the routing/policy contract, not live model translation quality.

Shared readability tokens set 30px page titles, 19px section headings, 15px body,
14px labels/navigation/buttons and 13px metadata, with 42–44px control rhythm.
This changes typography, not page layouts or Home/onboarding behavior. Agent
controls use visible focus and compact summaries; mobile dialogs become sheets.
The duplicate Agent playground resource link was removed; Test Agent has one
existing destination with agent selection.

## Checkpoints

| Checkpoint | Commit |
| --- | --- |
| Foundation | `3a9499564d485583efda8ff9b14e8451098fb13e` |
| Library and General | `ed010e05b63210e5731a9d095bc6e9b361fe64ed` |
| Knowledge scope and Languages | `c4faef9b48c32078373821b6af4b57af8bcdf618` |
| Channels, conversations and Test Agent | `1d2228276593bd819ba954da80d276959f2e0028` |
| Language runtime, readability and acceptance coverage | `0dcb5e54415e0de0f48fb4b7b7cba1b33b3fb7cd` |

## Validation workflow

CI runs the unchanged Foundation acceptance against the historical runtime before
upgrading its disposable schema. It then validates Foundation → current upgrade,
current pre-Agent schema → Agent V2 with populated settings/Knowledge/channels/
conversations/leads/completion, and the current runtime against the migrated
schema. The upgrade fixture compares every original column before and after.
Application checks, all database isolation/security tests, channel acceptance,
API smoke and the production build remain required. Production build precedes
Playwright; the new Agents flow runs alongside all four existing flows.

Final results and the file inventory are recorded after the final CI/visual review.
