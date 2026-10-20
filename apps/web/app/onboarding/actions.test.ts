import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { skipSetupChannel } from "./actions";

vi.mock("@/lib/workspace", () => ({ requireWorkspace: vi.fn() }));
vi.mock("@/app/app/agent/actions", () => ({ saveAgent: vi.fn() }));
vi.mock("@/app/app/channels/actions", () => ({ saveWebsiteChannel: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
}));
beforeEach(() => vi.clearAllMocks());
describe("optional channel completion", () => {
  const rpc = vi.fn();
  beforeEach(() => {
    vi.mocked(requireWorkspace).mockResolvedValue({
      workspace: { id: "current-workspace" },
      supabase: { rpc },
    } as unknown as Awaited<ReturnType<typeof requireWorkspace>>);
  });
  it("persists completion through the validated RPC and enters the normal shell", async () => {
    rpc.mockResolvedValue({ data: "2026-10-20T10:00:00Z", error: null });
    await expect(
      skipSetupChannel({ status: "idle", message: "" }),
    ).rejects.toThrow("redirect");
    expect(rpc).toHaveBeenCalledExactlyOnceWith(
      "complete_onboarding_without_channel",
      { target_workspace_id: "current-workspace" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/app", "layout");
    expect(redirect).toHaveBeenCalledWith("/app");
  });
  it("does not navigate or claim completion when prerequisites or persistence fail", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "22023" } });
    const result = await skipSetupChannel({ status: "idle", message: "" });
    expect(result.status).toBe("error");
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
