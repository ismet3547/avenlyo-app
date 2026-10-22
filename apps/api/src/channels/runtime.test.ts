import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultSettings,
  type Database,
  type StartedChannelTurn,
} from "@avenlyo-app/shared";
import { FrontOfficeRuntime } from "../runtime/agent.js";
import type { AgentProvider } from "../runtime/provider.js";
const run: StartedChannelTurn = {
  run_id: "11111111-1111-4111-8111-111111111111",
  conversation_id: "22222222-2222-4222-8222-222222222222",
  workspace_id: "33333333-3333-4333-8333-333333333333",
  state: "processing",
  existing: false,
  response: null,
};
function setup(
  options: {
    channel?: "website_chat" | "instagram";
    paused?: boolean;
    content?: string;
    knowledge?: boolean;
    window?: boolean;
  } = {},
) {
  const respond = vi.fn(
    async (input: Parameters<AgentProvider["respond"]>[0]) => {
      void input;
      return {
        reply: "We offer logo design. I've notified the team.",
        request_human: true,
        interest: "service" as const,
        name: null,
        email: null,
        phone: null,
        company: null,
      };
    },
  );
  const embed = vi.fn(async () => [1, ...Array(1535).fill(0)]);
  const content = options.content ?? "I'm interested in your logo design.";
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>) => {
    if (name === "channel_runtime_context")
      return {
        data: {
          businessName: "Northstar Studio",
          languages: { primary: "en", additional: [], legacy: false },
          settings: defaultSettings,
          aiMode: options.paused ? "paused" : "active",
          channel: options.channel ?? "website_chat",
          history: [{ role: "customer", content }],
          content,
          replyWindowOpen: options.window ?? true,
        },
        error: null,
      };
    if (name === "match_channel_knowledge")
      return {
        data:
          options.knowledge === false
            ? []
            : [
                {
                  id: "44444444-4444-4444-8444-444444444444",
                  title: "Design",
                  content: "We offer logo design.",
                  revision: 2,
                },
              ],
        error: null,
      };
    return {
      data: {
        conversationId: run.conversation_id,
        reply: options.paused ? "" : args?.assistant_content,
        needsHuman: args?.request_human,
        leadId: null,
        sources: [],
        replayed: false,
      },
      error: null,
    };
  });
  return {
    runtime: new FrontOfficeRuntime(
      { rpc } as unknown as SupabaseClient<Database>,
      {
        respond,
        embed,
        detectLanguage: async () => "en",
        localize: async (text) => text,
      },
    ),
    rpc,
    respond,
    embed,
  };
}
describe("one FrontOfficeRuntime for all channels", () => {
  it.each(["website_chat", "instagram"] as const)(
    "uses the same grounded policy for %s",
    async (channel) => {
      const { runtime, respond } = setup({ channel });
      const result = await runtime.channelTurn(run);
      expect(respond).toHaveBeenCalledTimes(1);
      expect(respond.mock.calls[0][0].instructions).toContain(
        "Hard human handoff is controlled by server policy",
      );
      expect(result.needsHuman).toBe(false);
      expect(result.reply).not.toContain("notified the team");
    },
  );
  it("does not invoke AI for a paused external follow-up", async () => {
    const { runtime, respond, embed } = setup({ paused: true });
    await runtime.channelTurn(run);
    expect(respond).not.toHaveBeenCalled();
    expect(embed).not.toHaveBeenCalled();
  });
  it("keeps explicit human requests deterministic and independent of model output", async () => {
    const { runtime, respond } = setup({
      content: "I want to speak with a person.",
    });
    expect((await runtime.channelTurn(run)).needsHuman).toBe(true);
    expect(respond).not.toHaveBeenCalled();
  });
  it("fails missing knowledge conservatively to the same handoff", async () => {
    const { runtime, respond } = setup({ knowledge: false });
    expect((await runtime.channelTurn(run)).needsHuman).toBe(true);
    expect(respond).not.toHaveBeenCalled();
  });
  it("does not invoke AI outside the supported provider reply window", async () => {
    const { runtime, respond, embed } = setup({
      channel: "instagram",
      window: false,
    });
    await runtime.channelTurn(run);
    expect(respond).not.toHaveBeenCalled();
    expect(embed).not.toHaveBeenCalled();
  });
  it("replays a completed external run without a second model call", async () => {
    const { runtime, respond, rpc } = setup();
    const response = {
      conversationId: run.conversation_id,
      reply: "Saved answer",
      needsHuman: false,
      leadId: null,
      sources: [],
      replayed: false,
    };
    expect(
      (
        await runtime.channelTurn({
          ...run,
          existing: true,
          state: "completed",
          response,
        })
      ).replayed,
    ).toBe(true);
    expect(respond).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});
