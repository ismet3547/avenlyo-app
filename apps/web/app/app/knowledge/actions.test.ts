import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookup } from "node:dns/promises";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { callApi } from "@/lib/api";
import {
  importKnowledgeFile,
  importKnowledgeFromUrl,
  knowledgeEditorOperation,
  saveKnowledge,
} from "./actions";
vi.mock("@/lib/workspace", () => ({ requireWorkspace: vi.fn() }));
vi.mock("@/lib/api", () => ({ callApi: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
const workspace = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const initial = { status: "idle", message: "" } as const;
const rpc = vi.fn();
const fetchPage = vi.fn();
function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    type: "custom_note",
    title: "Business information",
    content: "We offer custom design services.",
    return_to: "editor",
    ...values,
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockReset();
  fetchPage.mockReset();
  rpc.mockResolvedValue({ data: id, error: null });
  vi.mocked(callApi).mockResolvedValue({ status: 200 } as Awaited<
    ReturnType<typeof callApi>
  >);
  vi.mocked(requireWorkspace).mockResolvedValue({
    workspace: { id: workspace },
    role: "owner",
    supabase: { rpc },
  } as unknown as Awaited<ReturnType<typeof requireWorkspace>>);
  vi.mocked(lookup).mockResolvedValue([
    { address: "93.184.216.34", family: 4 },
  ] as never);
  vi.stubGlobal("fetch", fetchPage);
});
afterEach(() => vi.unstubAllGlobals());
describe("focused Knowledge lifecycle", () => {
  it("keeps Save draft in the editor and never publishes implicitly", async () => {
    await expect(saveKnowledge(initial, form())).rejects.toThrow(
      `REDIRECT:/app/knowledge/${id}?notice=saved`,
    );
    expect(rpc).toHaveBeenCalledWith(
      "save_business_knowledge",
      expect.objectContaining({
        target_workspace_id: workspace,
        target_item_id: null,
        item_type: "custom_note",
        expected_revision: null,
      }),
    );
    expect(callApi).not.toHaveBeenCalled();
  });
  it("retains the existing onboarding save destination", async () => {
    const data = form({ onboarding: "true" });
    data.delete("return_to");
    await expect(saveKnowledge(initial, data)).rejects.toThrow(
      `REDIRECT:/onboarding?step=knowledge&item=${id}`,
    );
  });
  it("explicit Publish saves the current fields then uses the existing publication API", async () => {
    await expect(
      saveKnowledge(initial, form({ intent: "publish", id, revision: "4" })),
    ).rejects.toThrow(`REDIRECT:/app/knowledge/${id}?notice=published`);
    expect(rpc).toHaveBeenCalledWith(
      "save_business_knowledge",
      expect.objectContaining({ target_item_id: id, expected_revision: 4 }),
    );
    expect(callApi).toHaveBeenCalledExactlyOnceWith(
      `/v1/knowledge/${id}/publish`,
      { workspaceId: workspace },
    );
  });
  it("keeps a saved draft reviewable after a publication failure without creating a second draft", async () => {
    vi.mocked(callApi).mockResolvedValue({ status: 503 } as Awaited<
      ReturnType<typeof callApi>
    >);
    await expect(
      saveKnowledge(initial, form({ intent: "publish" })),
    ).rejects.toThrow(`REDIRECT:/app/knowledge/${id}?notice=publish-failed`);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("does not publish or navigate after a rejected/stale save", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "40001", message: "private database error" },
    });
    const result = await saveKnowledge(
      initial,
      form({ id, revision: "3", intent: "publish" }),
    );
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("private database error");
    expect(callApi).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
  it.each([
    {
      intent: "draft",
      rpcName: "change_knowledge_status",
      destination: `/app/knowledge/${id}?notice=draft`,
    },
    {
      intent: "archived",
      rpcName: "change_knowledge_status",
      destination: "/app/knowledge/archived",
    },
    {
      intent: "delete",
      rpcName: "delete_knowledge_item",
      destination: "/app/knowledge",
    },
  ])(
    "reuses the scoped $intent action and safe navigation",
    async ({ intent, rpcName, destination }) => {
      await expect(
        knowledgeEditorOperation(initial, form({ id, intent })),
      ).rejects.toThrow(`REDIRECT:${destination}`);
      expect(rpc).toHaveBeenCalledWith(
        rpcName,
        expect.objectContaining({
          target_workspace_id: workspace,
          target_item_id: id,
        }),
      );
      if (intent === "draft")
        expect(rpc.mock.calls[0][1].target_status).toBe("draft");
      expect(callApi).not.toHaveBeenCalled();
    },
  );
  it("publishes an already saved draft without an unnecessary content rewrite", async () => {
    await expect(
      knowledgeEditorOperation(initial, form({ id, intent: "publish" })),
    ).rejects.toThrow(`REDIRECT:/app/knowledge/${id}?notice=published`);
    expect(rpc).not.toHaveBeenCalled();
    expect(callApi).toHaveBeenCalledOnce();
  });
});
describe("imports remain safe Draft creation flows", () => {
  it.each(["txt", "md", "csv", "json", "html"])(
    "opens a %s file in Draft review without publishing",
    async (extension) => {
      const data = form();
      data.set(
        "file",
        new File(
          [
            extension === "html"
              ? "<title>Imported facts</title><p>We offer design services.</p><script>hidden()</script>"
              : "We offer design services.",
          ],
          `business-facts.${extension}`,
        ),
      );
      await expect(importKnowledgeFile(initial, data)).rejects.toThrow(
        `REDIRECT:/app/knowledge/${id}?notice=file-imported`,
      );
      expect(rpc).toHaveBeenCalledExactlyOnceWith(
        "save_business_knowledge",
        expect.objectContaining({
          target_workspace_id: workspace,
          target_item_id: null,
          item_type: "custom_note",
          expected_revision: null,
          item_price_statement: "",
          item_details: "",
          item_collection_id: null,
        }),
      );
      expect(rpc.mock.calls[0][1].item_content).not.toContain("hidden()");
      expect(callApi).not.toHaveBeenCalled();
    },
  );
  it("preserves the existing 6,000-character import bound", async () => {
    const data = form();
    data.set("file", new File(["x".repeat(6200)], "business-facts.txt"));
    await expect(importKnowledgeFile(initial, data)).rejects.toThrow(
      "REDIRECT:",
    );
    expect(rpc.mock.calls[0][1].item_content).toHaveLength(6000);
  });
  it.each([
    {
      name: "facts.pdf",
      text: "unsupported",
      expected: "Use TXT, Markdown, CSV, JSON or HTML",
    },
    {
      name: "facts.txt",
      text: "x".repeat(1_000_001),
      expected: "1 MB or smaller",
    },
  ])(
    "rejects unsupported or oversized files: $name",
    async ({ name, text, expected }) => {
      const data = form();
      data.set("file", new File([text], name));
      const result = await importKnowledgeFile(initial, data);
      expect(result.status).toBe("error");
      expect(result.message).toContain(expected);
      expect(rpc).not.toHaveBeenCalled();
      expect(callApi).not.toHaveBeenCalled();
    },
  );
  it("normalizes and imports one public webpage as a Custom note Draft", async () => {
    fetchPage.mockResolvedValue(
      new Response(
        "<title>Design services</title><p>Custom business services.</p><script>privateScript()</script>",
        { headers: { "content-type": "text/html" } },
      ),
    );
    await expect(
      importKnowledgeFromUrl(initial, form({ url: "example.com/services" })),
    ).rejects.toThrow(
      `REDIRECT:/app/knowledge/${id}?notice=webpage-imported&source=example.com`,
    );
    expect(fetchPage).toHaveBeenCalledWith(
      new URL("https://example.com/services"),
      expect.objectContaining({ redirect: "manual" }),
    );
    expect(rpc.mock.calls[0][1]).toMatchObject({
      item_type: "custom_note",
      item_title: "Design services",
      item_content: "Design services Custom business services.",
    });
    expect(rpc.mock.calls[0][1].item_content).not.toContain("privateScript");
    expect(callApi).not.toHaveBeenCalled();
  });
  it("revalidates redirect destinations before fetching them", async () => {
    fetchPage.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "http://localhost/private" },
      }),
    );
    const result = await importKnowledgeFromUrl(
      initial,
      form({ url: "https://example.com" }),
    );
    expect(result.status).toBe("error");
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects DNS resolving to a private address before any fetch", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "127.0.0.1", family: 4 },
    ] as never);
    expect(
      (
        await importKnowledgeFromUrl(
          initial,
          form({ url: "https://example.com" }),
        )
      ).status,
    ).toBe("error");
    expect(fetchPage).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("returns a useful known blocking error and hides raw transport exceptions", async () => {
    fetchPage.mockResolvedValueOnce(new Response(null, { status: 403 }));
    expect(
      (
        await importKnowledgeFromUrl(
          initial,
          form({ url: "https://example.com" }),
        )
      ).message,
    ).toBe("The website blocked automated access.");
    fetchPage.mockRejectedValueOnce(new TypeError("private-network-secret"));
    const result = await importKnowledgeFromUrl(
      initial,
      form({ url: "https://example.com" }),
    );
    expect(result.message).toContain("We couldn’t import this webpage");
    expect(result.message).not.toContain("private-network-secret");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects an oversized fetched page without persisting or publishing it", async () => {
    fetchPage.mockResolvedValue(
      new Response("x".repeat(1_000_001), {
        headers: { "content-type": "text/plain" },
      }),
    );
    expect(
      (
        await importKnowledgeFromUrl(
          initial,
          form({ url: "https://example.com" }),
        )
      ).message,
    ).toContain("too large");
    expect(rpc).not.toHaveBeenCalled();
    expect(callApi).not.toHaveBeenCalled();
  });
});
