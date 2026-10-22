import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireWorkspace } from "@/lib/workspace";
import {
  createAgent,
  saveAgentField,
  saveAgentScope,
  saveAgentLanguages,
} from "./actions";
vi.mock("@/lib/workspace", () => ({ requireWorkspace: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
const workspace = "11111111-1111-4111-8111-111111111111",
  id = "22222222-2222-4222-8222-222222222222";
const initial = { status: "idle", message: "" } as const;
const rpc = vi.fn(),
  read = vi.fn();
const settings = {
  tone: "warm",
  goals: ["answer_questions", "collect_contact", "human_handoff"],
  contact_fields: ["name", "email"],
  setup_brief: "Help customers.",
  name: "Front Office",
};
function form(values: Record<string, string | string[]>) {
  const f = new FormData();
  f.set("agent_id", id);
  for (const [k, v] of Object.entries(values))
    for (const item of Array.isArray(v) ? v : [v]) f.append(k, item);
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: id, error: null });
  read.mockResolvedValue({ data: settings, error: null });
  const q = { select: () => q, eq: () => q, is: () => q, maybeSingle: read };
  vi.mocked(requireWorkspace).mockResolvedValue({
    workspace: { id: workspace },
    supabase: { rpc, from: () => q },
  } as unknown as Awaited<ReturnType<typeof requireWorkspace>>);
});
describe("Agent V2 actions", () => {
  it("creates an Agent with validated defaults and enters its detail", async () => {
    await expect(
      createAgent(
        initial,
        form({
          name: "Sales",
          setup_brief: "Qualify inquiries.",
          primary_language: "tr",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/app/agent/${id}`);
    expect(rpc).toHaveBeenCalledWith("create_agent", {
      target_workspace_id: workspace,
      agent_name: "Sales",
      role_brief: "Qualify inquiries.",
      primary_code: "tr",
    });
  });
  it("rejects unsupported creation languages before writing", async () => {
    expect(
      (
        await createAgent(
          initial,
          form({
            name: "Sales",
            setup_brief: "Qualify inquiries.",
            primary_language: "unknown",
          }),
        )
      ).status,
    ).toBe("error");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("edits only the requested setting with current server state", async () => {
    expect(
      (
        await saveAgentField(
          initial,
          form({ field: "name", name: "Reception" }),
        )
      ).status,
    ).toBe("success");
    expect(rpc).toHaveBeenCalledWith(
      "save_agent",
      expect.objectContaining({
        agent_name: "Reception",
        settings: expect.objectContaining({
          tone: "warm",
          setup_brief: "Help customers.",
          human_handoff_enabled: true,
        }),
      }),
    );
  });
  it("disabling contact collection clears unsupported fields and retains handoff", async () => {
    await saveAgentField(
      initial,
      form({ field: "goals", goals: ["answer_questions"] }),
    );
    expect(rpc).toHaveBeenCalledWith(
      "save_agent",
      expect.objectContaining({
        settings: expect.objectContaining({
          goals: ["answer_questions", "human_handoff"],
          contact_fields: [],
        }),
      }),
    );
  });
  it("rejects unknown settings and duplicate goals", async () => {
    expect(
      (await saveAgentField(initial, form({ field: "model" }))).status,
    ).toBe("error");
    expect(
      (
        await saveAgentField(
          initial,
          form({
            field: "goals",
            goals: ["answer_questions", "answer_questions"],
          }),
        )
      ).status,
    ).toBe("error");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("saves item bindings through workspace-scoped owner RPC", async () => {
    await saveAgentScope(initial, form({ mode: "selected", item_ids: [id] }));
    expect(rpc).toHaveBeenCalledWith("set_agent_knowledge_scope", {
      target_workspace_id: workspace,
      target_agent_id: id,
      scope_mode: "selected",
      item_ids: [id],
    });
  });
  it("saves Agent-specific languages and requires primary replacement", async () => {
    await saveAgentLanguages(
      initial,
      form({ primary_language: "tr", additional_languages: ["en"] }),
    );
    expect(rpc).toHaveBeenCalledWith("set_agent_languages", {
      target_workspace_id: workspace,
      target_agent_id: id,
      primary_code: "tr",
      additional_codes: ["en"],
    });
    expect(
      (
        await saveAgentLanguages(
          initial,
          form({ additional_languages: ["en"] }),
        )
      ).status,
    ).toBe("error");
  });
  it("never exposes raw infrastructure errors", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "secret database internal" },
    });
    const result = await saveAgentScope(initial, form({ mode: "all" }));
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("secret");
  });
});
