import {
  agentSettingsSchema,
  modelResponseSchema,
  type Channel,
  type Database,
  type Json,
  type ModelResponse,
  type StartedChannelTurn,
  type TurnResult,
} from "@avenlyo-app/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { validatedLead } from "./lead.js";
import {
  customerSafeReply,
  explicitHumanRequest,
  instructions,
  isGreeting,
} from "./policy.js";
import type { AgentProvider } from "./provider.js";
import { boundedInstagramText } from "../channels/security.js";

export class RuntimeError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
  ) {
    super(code);
  }
}
type Run = {
  run_id: string;
  conversation_id: string;
  state: string;
  existing: boolean;
  response: Json | null;
};
type Reference = { id: string; title: string; revision: number };
type Match = Reference & { content: string };
type Context = {
  businessName: string;
  settings: unknown;
  aiMode: string;
  channel: Channel;
  history: { role: "customer" | "assistant" | "human"; content: string }[];
  content: string;
  replyWindowOpen: boolean;
};
const channelContextSchema = z.object({
  businessName: z.string().min(2).max(100),
  settings: z.unknown(),
  aiMode: z.enum(["active", "paused"]),
  channel: z.enum(["website_chat", "instagram"]),
  history: z
    .array(
      z.object({
        role: z.enum(["customer", "assistant", "human"]),
        content: z.string().max(2500),
      }),
    )
    .max(24),
  content: z.string().max(2000),
  replyWindowOpen: z.boolean(),
});

// Channel adapters authenticate and create a bounded run. All behavior below is shared.
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
    return this.complete(
      run,
      async () => {
        const [workspace, settings, conversation, messages] = await Promise.all(
          [
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
          ],
        );
        if (
          workspace.error ||
          settings.error ||
          conversation.error ||
          messages.error
        )
          throw new RuntimeError("CONTEXT_UNAVAILABLE", 503);
        return {
          businessName: workspace.data.name,
          settings: settings.data,
          aiMode: conversation.data.ai_mode,
          channel: "test_agent",
          history: [...messages.data].reverse(),
          content: input.content,
          replyWindowOpen: true,
        };
      },
      async (embedding) => {
        const matches = await user.rpc("match_knowledge", {
          target_workspace_id: input.workspaceId,
          query_embedding: JSON.stringify(embedding),
          match_limit: 5,
        });
        if (matches.error) throw new RuntimeError("KNOWLEDGE_UNAVAILABLE", 503);
        return matches.data ?? [];
      },
      async (output, sources, lead) => {
        const result = await this.service.rpc("finish_agent_turn", {
          actor_id: actorId,
          target_run_id: run.run_id,
          assistant_content: output.reply,
          source_references: sources as unknown as Json,
          request_human: output.request_human,
          lead_payload: lead as unknown as Json | null,
        });
        if (result.error || !result.data)
          throw new RuntimeError("PERSISTENCE_UNAVAILABLE", 503);
        return result.data as unknown as TurnResult;
      },
      async () => {
        await this.service.rpc("fail_agent_turn", {
          actor_id: actorId,
          target_run_id: run.run_id,
        });
      },
    );
  }
  async channelTurn(run: StartedChannelTurn): Promise<TurnResult> {
    return this.complete(
      run,
      async () => {
        const context = await this.service.rpc("channel_runtime_context", {
          target_run_id: run.run_id,
        });
        if (context.error)
          throw new RuntimeError("CHANNEL_CONTEXT_UNAVAILABLE", 503);
        return channelContextSchema.parse(context.data);
      },
      async (embedding) => {
        const knowledge = await this.service.rpc("match_channel_knowledge", {
          target_run_id: run.run_id,
          query_embedding: JSON.stringify(embedding),
        });
        if (knowledge.error)
          throw new RuntimeError("KNOWLEDGE_UNAVAILABLE", 503);
        return knowledge.data ?? [];
      },
      async (output, sources, lead) => {
        const result = await this.service.rpc("finish_channel_turn", {
          target_run_id: run.run_id,
          assistant_content: output.reply,
          source_references: sources as unknown as Json,
          request_human: output.request_human,
          lead_payload: lead as unknown as Json | null,
        });
        if (result.error || !result.data)
          throw new RuntimeError("PERSISTENCE_UNAVAILABLE", 503);
        return result.data as unknown as TurnResult;
      },
      async () => {
        await this.service.rpc("fail_channel_turn", {
          target_run_id: run.run_id,
        });
      },
    );
  }
  private async complete(
    run: Run,
    load: () => Promise<Context>,
    match: (embedding: number[]) => Promise<Match[]>,
    finish: (
      output: ModelResponse,
      sources: Reference[],
      lead: ReturnType<typeof validatedLead>,
    ) => Promise<TurnResult>,
    fail: () => Promise<void>,
  ): Promise<TurnResult> {
    if (run.existing) {
      if (run.state === "completed" && run.response)
        return { ...(run.response as unknown as TurnResult), replayed: true };
      throw new RuntimeError(
        run.state === "processing" ? "TURN_PROCESSING" : "TURN_FAILED",
        409,
      );
    }
    try {
      const context = await load();
      const settings = agentSettingsSchema.parse({
        ...(context.settings as object),
        setup_brief: "",
      });
      const customerTurns = context.history
        .filter((m) => m.role === "customer")
        .map((m) => m.content);
      let sources: Reference[] = [];
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
        context.aiMode === "paused" ||
        explicitHumanRequest(context.content) ||
        !settings.goals.includes("answer_questions") ||
        !context.replyWindowOpen
      ) {
        output = {
          ...base,
          request_human: true,
          reply:
            context.channel === "test_agent"
              ? "This test conversation needs human assistance. Automated answers are paused. No external team notification has been sent."
              : "A team member can continue this conversation. Automated answers are paused.",
        };
      } else if (isGreeting(context.content)) {
        output = {
          ...base,
          reply: "Hi! What would you like to know about our services?",
        };
      } else {
        const embedding = await this.provider.embed(
          customerTurns.slice(-4).join("\n").slice(0, 6000),
        );
        const matches = await match(embedding);
        if (!matches.length)
          output = {
            ...base,
            request_human: true,
            reply:
              context.channel === "test_agent"
                ? "I do not have enough published business information to answer that reliably. This test conversation needs the team’s help."
                : "I do not have enough published business information to answer that reliably. A team member can continue this conversation.",
          };
        else {
          sources = matches.map((m) => ({
            id: m.id,
            title: m.title,
            revision: m.revision,
          }));
          const model = modelResponseSchema.parse(
            await this.provider.respond({
              instructions: instructions(settings, context.channel),
              businessName: context.businessName,
              knowledge: matches.map((m) => ({
                id: m.id,
                title: m.title,
                content: m.content,
              })),
              history: context.history,
            }),
          );
          // A model recommendation never grants hard handoff authority.
          output = { ...model, request_human: false };
        }
      }
      const lead = validatedLead(
        settings,
        customerTurns,
        output,
        output.request_human,
      );
      const safeReply = customerSafeReply(output.reply, Boolean(lead));
      output.reply =
        context.channel === "instagram"
          ? boundedInstagramText(safeReply)
          : safeReply;
      return await finish(output, sources, lead);
    } catch (error) {
      await fail().catch(() => undefined);
      throw error instanceof RuntimeError
        ? error
        : new RuntimeError("AGENT_UNAVAILABLE", 503);
    }
  }
}
