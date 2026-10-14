import {
  agentSettingsSchema,
  type Database,
  type Json,
  type ModelResponse,
  type TurnResult,
} from "@avenlyo-app/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { validatedLead } from "./lead.js";
import {
  customerSafeReply,
  explicitHumanRequest,
  instructions,
  isGreeting,
} from "./policy.js";
import type { AgentProvider } from "./provider.js";

export class RuntimeError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
  ) {
    super(code);
  }
}
export class FrontOfficeRuntime {
  constructor(
    private readonly service: SupabaseClient<Database>,
    private readonly provider: AgentProvider,
  ) {}
  async turn(
    actorId: string,
    user: SupabaseClient<Database>,
    input: {
      workspaceId: string;
      conversationId: string | null;
      idempotencyKey: string;
      content: string;
    },
  ): Promise<TurnResult> {
    const started = await this.service.rpc("begin_agent_turn", {
      actor_id: actorId,
      target_workspace_id: input.workspaceId,
      target_conversation_id: input.conversationId,
      target_idempotency_key: input.idempotencyKey,
      customer_content: input.content,
    });
    if (started.error)
      throw new RuntimeError(
        started.error.code === "42501" ? "FORBIDDEN" : "TURN_CONFLICT",
        started.error.code === "42501" ? 403 : 409,
      );
    const run = started.data?.[0];
    if (!run) throw new RuntimeError("TURN_UNAVAILABLE", 503);
    if (run.existing) {
      if (run.state === "completed" && run.response)
        return { ...(run.response as unknown as TurnResult), replayed: true };
      throw new RuntimeError(
        run.state === "processing" ? "TURN_PROCESSING" : "TURN_FAILED",
        409,
      );
    }
    try {
      const [workspace, settings, conversation, messages] = await Promise.all([
        user
          .from("workspaces")
          .select("name")
          .eq("id", input.workspaceId)
          .single(),
        user
          .from("agent_settings")
          .select("tone,goals,contact_fields,human_handoff_enabled")
          .eq("workspace_id", input.workspaceId)
          .single(),
        user
          .from("conversations")
          .select("ai_mode")
          .eq("id", run.conversation_id)
          .eq("workspace_id", input.workspaceId)
          .single(),
        user
          .from("messages")
          .select("role,content")
          .eq("workspace_id", input.workspaceId)
          .eq("conversation_id", run.conversation_id)
          .order("created_at", { ascending: false })
          .limit(24),
      ]);
      if (
        workspace.error ||
        settings.error ||
        conversation.error ||
        messages.error
      )
        throw new RuntimeError("CONTEXT_UNAVAILABLE", 503);
      const config = agentSettingsSchema.parse({
        ...settings.data,
        setup_brief: "",
      });
      const history = [...messages.data].reverse();
      const customerTurns = history
        .filter((m) => m.role === "customer")
        .map((m) => m.content);
      let sources: { id: string; title: string; revision: number }[] = [];
      const base: ModelResponse = {
        reply: "",
        request_human: false,
        interest: "general",
        name: null,
        email: null,
        phone: null,
        company: null,
      };
      let output: ModelResponse;
      if (
        conversation.data.ai_mode === "paused" ||
        explicitHumanRequest(input.content) ||
        !config.goals.includes("answer_questions")
      ) {
        output = {
          ...base,
          request_human: true,
          reply:
            "This test conversation needs human assistance. Automated answers are paused. No external team notification has been sent.",
        };
      } else if (isGreeting(input.content)) {
        output = {
          ...base,
          reply: "Hi! What would you like to know about our services?",
        };
      } else {
        const embedding = await this.provider.embed(
          customerTurns.slice(-4).join("\n").slice(0, 6000),
        );
        const knowledge = await user.rpc("match_knowledge", {
          target_workspace_id: input.workspaceId,
          query_embedding: JSON.stringify(embedding),
          match_limit: 5,
        });
        if (knowledge.error)
          throw new RuntimeError("KNOWLEDGE_UNAVAILABLE", 503);
        const matches = knowledge.data ?? [];
        if (!matches.length)
          output = {
            ...base,
            request_human: true,
            reply:
              "I do not have enough published business information to answer that reliably. This test conversation needs the team’s help.",
          };
        else {
          sources = matches.map((m) => ({
            id: m.id,
            title: m.title,
            revision: m.revision,
          }));
          const modelOutput = await this.provider.respond({
            instructions: instructions(config),
            businessName: workspace.data.name,
            knowledge: matches.map((m) => ({
              id: m.id,
              title: m.title,
              content: m.content,
            })),
            history,
          });
          // The model may recommend human help, but it cannot pause an otherwise
          // grounded, answerable conversation. Hard handoff stays server-owned.
          output = { ...modelOutput, request_human: false };
        }
      }
      const lead = validatedLead(
        config,
        customerTurns,
        output,
        output.request_human,
      );
      const assistantReply = customerSafeReply(output.reply, Boolean(lead));
      const finished = await this.service.rpc("finish_agent_turn", {
        actor_id: actorId,
        target_run_id: run.run_id,
        assistant_content: assistantReply,
        source_references: sources as unknown as Json,
        request_human: output.request_human,
        lead_payload: lead as unknown as Json | null,
      });
      if (finished.error || !finished.data)
        throw new RuntimeError("PERSISTENCE_UNAVAILABLE", 503);
      return finished.data as unknown as TurnResult;
    } catch (error) {
      await this.service.rpc("fail_agent_turn", {
        actor_id: actorId,
        target_run_id: run.run_id,
      });
      throw error instanceof RuntimeError
        ? error
        : new RuntimeError("AGENT_UNAVAILABLE", 503);
    }
  }
}
