import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@avenlyo-app/shared";
import { productContext } from "@/lib/product-data";
import { onboardingState } from "@/lib/onboarding";
import Page from "./page";
vi.mock("@/lib/product-data", () => ({ productContext: vi.fn() }));
vi.mock("@/lib/onboarding", () => ({ onboardingState: vi.fn() }));
vi.mock("@/components/onboarding", () => ({
  SetupAccordion: vi.fn(),
  SetupAgent: vi.fn(),
  SetupKnowledge: vi.fn(),
  SetupTest: vi.fn(),
  SetupChannel: vi.fn(),
}));
vi.mock("@/components/product-forms", () => ({ EmbedSnippet: vi.fn() }));
describe("first setup page", () => {
  it("reads the persisted settings row without feeding database metadata to the strict agent schema", async () => {
    const query = { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: {
        ...defaultSettings,
        workspace_id: "workspace",
        updated_at: "2026-10-20T10:00:00Z",
      },
      error: null,
    });
    vi.mocked(productContext).mockResolvedValue({
      role: "owner",
      workspace: { id: "workspace" },
      supabase: { from: () => query },
    } as unknown as Awaited<ReturnType<typeof productContext>>);
    vi.mocked(onboardingState).mockResolvedValue({
      configured: false,
      published: false,
      tested: false,
      connected: false,
      completedAt: null,
    });
    expect(
      await Page({ searchParams: Promise.resolve({ step: "channel" }) }),
    ).toBeDefined();
    expect(query.single).toHaveBeenCalledOnce();
  });
});
