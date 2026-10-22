import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultSettings,
  type Database,
  type Language,
  type StartedChannelTurn,
} from "@avenlyo-app/shared";
import { FrontOfficeRuntime } from "./agent.js";
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
    primary?: Language;
    additional?: Language[];
    detected?: Language | "other";
    legacy?: boolean;
    content?: string;
    knowledge?: boolean;
  } = {},
) {
  const content = options.content ?? "What services do you offer?";
  const detectLanguage = vi.fn(async () => options.detected ?? "en"),
    localize = vi.fn(
      async (_text: string, language: Language) => `Fixed reply in ${language}`,
    );
  const respond = vi.fn(async () => ({
    reply: "Only the approved business facts.",
    request_human: false,
    interest: "general" as const,
    name: null,
    email: null,
    phone: null,
    company: null,
  }));
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>) => {
    if (name === "channel_runtime_context")
      return {
        data: {
          businessName: "Studio",
          settings: defaultSettings,
          aiMode: "active",
          channel: "website_chat",
          history: [{ role: "customer", content }],
          content,
          replyWindowOpen: true,
          languages: {
            primary: options.primary ?? "en",
            additional: options.additional ?? [],
            legacy: options.legacy ?? false,
          },
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
                  title: "Approved",
                  revision: 1,
                  content: "The one approved fact.",
                },
              ],
        error: null,
      };
    return {
      data: {
        reply: args?.assistant_content,
        sources: [],
        conversationId: run.conversation_id,
        needsHuman: args?.request_human,
        leadId: null,
        replayed: false,
      },
      error: null,
    };
  });
  const runtime = new FrontOfficeRuntime(
    { rpc } as unknown as SupabaseClient<Database>,
    {
      detectLanguage,
      localize,
      respond,
      embed: async () => [1, ...Array(1535).fill(0)],
    },
  );
  return { runtime, respond, detectLanguage, localize, rpc };
}
describe("Agent-specific runtime languages", () => {
  it("uses a supported customer language without partitioning factual Knowledge", async () => {
    const { runtime, respond } = setup({ detected: "tr", additional: ["tr"] });
    await runtime.channelTurn(run);
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining("Reply in language code tr"),
        knowledge: [
          expect.objectContaining({ content: "The one approved fact." }),
        ],
      }),
    );
  });
  it("falls back to this Agent's primary for unsupported languages", async () => {
    const { runtime, respond } = setup({ primary: "de", detected: "tr" });
    await runtime.channelTurn(run);
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining("Reply in language code de"),
      }),
    );
  });
  it("uses primary when language detection is uncertain", async () => {
    const { runtime, respond } = setup({ primary: "tr", detected: "other" });
    await runtime.channelTurn(run);
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining("Reply in language code tr"),
      }),
    );
  });
  it("preserves legacy multilingual behavior until explicitly configured", async () => {
    const { runtime, respond, detectLanguage } = setup({ legacy: true });
    await runtime.channelTurn(run);
    expect(detectLanguage).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.not.stringContaining("Reply in language code"),
      }),
    );
  });
  it("localizes fixed greetings using the same supported-language policy", async () => {
    const { runtime, localize, respond } = setup({
      primary: "tr",
      detected: "tr",
      content: "Merhaba",
    });
    const result = await runtime.channelTurn(run);
    expect(localize).toHaveBeenCalledWith(expect.stringContaining("Hi!"), "tr");
    expect(result.reply).toBe("Fixed reply in tr");
    expect(respond).not.toHaveBeenCalled();
  });
  it("no Knowledge still requires handoff in the supported response language", async () => {
    const { runtime, localize } = setup({
      primary: "de",
      detected: "de",
      knowledge: false,
    });
    const result = await runtime.channelTurn(run);
    expect(result.needsHuman).toBe(true);
    expect(localize).toHaveBeenCalledWith(
      expect.stringContaining("published business information"),
      "de",
    );
  });
});
