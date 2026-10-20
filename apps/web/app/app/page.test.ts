import { beforeEach, describe, expect, it, vi } from "vitest";
import { onboardingState } from "@/lib/onboarding";
import { overviewData } from "@/lib/product-data";
import { redirect } from "next/navigation";
import Page from "./page";
vi.mock("@/lib/onboarding", () => ({ onboardingState: vi.fn() }));
vi.mock("@/lib/product-data", () => ({ overviewData: vi.fn() }));
vi.mock("@/components/overview", () => ({ Overview: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
}));
beforeEach(() => vi.clearAllMocks());
describe("authenticated Home routing", () => {
  it("routes an unfinished workspace to focused setup without loading Home data", async () => {
    vi.mocked(onboardingState).mockResolvedValue({
      configured: true,
      published: false,
      tested: false,
      connected: false,
      completedAt: null,
    });
    await expect(Page()).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/onboarding");
    expect(overviewData).not.toHaveBeenCalled();
  });
  it("keeps an activated workspace on Home after later health changes", async () => {
    vi.mocked(onboardingState).mockResolvedValue({
      configured: false,
      published: false,
      tested: true,
      connected: false,
      completedAt: "2026-10-20T10:00:00Z",
    });
    vi.mocked(overviewData).mockResolvedValue({
      attention: [],
      attentionCount: 0,
      recent: [],
      channels: [],
    });
    expect(await Page()).toBeDefined();
    expect(redirect).not.toHaveBeenCalled();
    expect(overviewData).toHaveBeenCalledOnce();
  });
  it("preserves a loading failure instead of treating unavailable progress as completion", async () => {
    vi.mocked(onboardingState).mockRejectedValue(
      new Error("Setup unavailable"),
    );
    await expect(Page()).rejects.toThrow("Setup unavailable");
    expect(overviewData).not.toHaveBeenCalled();
  });
});
