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
