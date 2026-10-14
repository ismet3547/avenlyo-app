import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@avenlyo-app/shared";
import { buildApp } from "./app.js";
import { configSchema } from "./config.js";
import type { AgentProvider } from "./runtime/provider.js";
const actor = "ae111111-1111-4111-8111-111111111111";
const workspace = "ae222222-2222-4222-8222-222222222222";
const conversation = "ae333333-3333-4333-8333-333333333333";
const run = "ae444444-4444-4444-8444-444444444444";
const token = "fictional-verified-token-for-test";
const body = {
  workspaceId: workspace,
  conversationId: null,
  idempotencyKey: "ae555555-5555-4555-8555-555555555555",
  content: "Hello",
};
const config = configSchema.parse({
  SUPABASE_URL: "http://127.0.0.1:55321",
  SUPABASE_PUBLISHABLE_KEY: "fictional-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "fictional-server-key",
});
const provider: AgentProvider = {
  embed: vi.fn(async () => [1, ...Array(1535).fill(0)]),
  respond: vi.fn(async () => ({
    reply: "We offer custom design.",
    request_human: false,
    interest: "service" as const,
    name: null,
    email: null,
    phone: null,
    company: null,
  })),
};
const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  vi.clearAllMocks();
});
function client(data: Record<string, unknown>, verified = true) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: verified ? { id: actor } : null },
        error: verified ? null : { message: "invalid" },
      })),
    },
    from: vi.fn((table: string) => {
      const result = { data: data[table], error: null };
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        single: async () => result,
        then: (resolve: (r: unknown) => unknown) =>
          Promise.resolve(result).then(resolve),
      };
      return query;
    }),
    rpc: vi.fn(async () => ({ data: [], error: null })),
  } as unknown as SupabaseClient<Database>;
}
async function setup(
  options: {
    verified?: boolean;
    denied?: boolean;
    existing?: boolean;
    knowledgeRole?: string;
  } = {},
) {
  const user = client(
    {
      workspaces: { name: "Northstar Studio" },
      agent_settings: {
        tone: "professional",
        goals: [
          "answer_questions",
          "identify_interest",
          "qualify_inquiries",
          "collect_contact",
          "human_handoff",
        ],
        contact_fields: ["name", "email"],
        human_handoff_enabled: true,
      },
      conversations: { ai_mode: "active" },
      messages: [{ role: "customer", content: "Hello" }],
      workspace_members: { role: options.knowledgeRole ?? "owner" },
      knowledge_items: {
        title: "Custom services",
        content: "We offer custom design.",
        revision: 1,
      },
    },
    options.verified,
  );
  const response = {
    conversationId: conversation,
    reply: "Hi! What would you like to know about our services?",
    leadId: null,
    needsHuman: false,
    sources: [],
    replayed: false,
  };
  const service = {
    rpc: vi.fn(async (name: string) =>
      name === "begin_agent_turn"
        ? options.denied
          ? { data: null, error: { code: "42501" } }
          : {
              data: [
                {
                  run_id: run,
                  conversation_id: conversation,
                  state: options.existing ? "completed" : "processing",
                  existing: Boolean(options.existing),
                  response: options.existing ? response : null,
                },
              ],
              error: null,
            }
        : name === "finish_agent_turn"
          ? { data: response, error: null }
          : { data: null, error: null },
    ),
  } as unknown as SupabaseClient<Database>;
  const app = await buildApp({
    config,
    userClient: () => user,
    serviceClient: service,
    provider,
    logger: false,
  });
  apps.push(app);
  return { app, user, service };
}
describe("API authorization and bounded ingress", () => {
  it("serves health with no provider credentials exposed", async () => {
    const { app } = await setup();
    const result = await app.inject({ url: "/health" });
    expect(result.statusCode).toBe(200);
    expect(result.body).not.toContain("fictional-server-key");
  });
  it("rejects missing authentication before runtime", async () => {
    const { app, service } = await setup();
    const result = await app.inject({
      method: "POST",
      url: "/v1/agent/turn",
      payload: body,
    });
    expect(result.statusCode).toBe(401);
    expect(service.rpc).not.toHaveBeenCalled();
  });
  it("revalidates a forged/expired bearer token", async () => {
    const { app, service } = await setup({ verified: false });
    const result = await app.inject({
      method: "POST",
      url: "/v1/agent/turn",
      headers: { authorization: `Bearer ${token}` },
      payload: body,
    });
    expect(result.statusCode).toBe(401);
    expect(service.rpc).not.toHaveBeenCalled();
  });
  it("rejects cross-workspace execution before any OpenAI request", async () => {
    const { app } = await setup({ denied: true });
    const result = await app.inject({
      method: "POST",
      url: "/v1/agent/turn",
      headers: { authorization: `Bearer ${token}` },
      payload: body,
    });
    expect(result.statusCode).toBe(403);
    expect(provider.embed).not.toHaveBeenCalled();
    expect(provider.respond).not.toHaveBeenCalled();
  });
  it("rejects a forged actor field", async () => {
    const { app, service } = await setup();
    const result = await app.inject({
      method: "POST",
      url: "/v1/agent/turn",
      headers: { authorization: `Bearer ${token}` },
      payload: { ...body, actorId: actor },
    });
    expect(result.statusCode).toBe(400);
    expect(service.rpc).not.toHaveBeenCalled();
  });
  it("bounds customer message length", async () => {
    const { app } = await setup();
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/v1/agent/turn",
          headers: { authorization: `Bearer ${token}` },
          payload: { ...body, content: "x".repeat(2001) },
        })
      ).statusCode,
    ).toBe(400);
  });
  it("persists a greeting through the common runtime without creating a lead", async () => {
    const { app, service } = await setup();
    const result = await app.inject({
      method: "POST",
      url: "/v1/agent/turn",
      headers: { authorization: `Bearer ${token}` },
      payload: body,
    });
    expect(result.statusCode).toBe(200);
    expect(service.rpc).toHaveBeenCalledWith(
      "finish_agent_turn",
      expect.objectContaining({ lead_payload: null, actor_id: actor }),
    );
  });
  it("replays the durable result without provider or finalization calls", async () => {
    const { app, service } = await setup({ existing: true });
    const result = await app.inject({
      method: "POST",
      url: "/v1/agent/turn",
      headers: { authorization: `Bearer ${token}` },
      payload: body,
    });
    expect(result.json().replayed).toBe(true);
    expect(service.rpc).toHaveBeenCalledTimes(1);
    expect(provider.respond).not.toHaveBeenCalled();
  });
  it("blocks a member from publishing before embedding", async () => {
    const { app } = await setup({ knowledgeRole: "member" });
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/v1/knowledge/${conversation}/publish`,
          headers: { authorization: `Bearer ${token}` },
          payload: { workspaceId: workspace },
        })
      ).statusCode,
    ).toBe(403);
    expect(provider.embed).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON without leaking parser details", async () => {
    const { app } = await setup();
    const result = await app.inject({
      method: "POST",
      url: "/v1/agent/turn",
      headers: { "content-type": "application/json" },
      payload: "{bad-json",
    });
    expect(result.statusCode).toBe(400);
    expect(result.json()).toEqual({ code: "INVALID_REQUEST" });
  });
});
