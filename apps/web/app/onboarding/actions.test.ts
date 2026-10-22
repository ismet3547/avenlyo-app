import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { saveWebsiteChannel } from "@/app/app/channels/actions";
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
  const logError = vi.fn();
  const initial = { status: "idle", message: "" } as const;
  const prerequisiteDbMessage =
    "Complete agent, published knowledge and a successful real test first";
  const prerequisiteMessage =
    "Complete agent setup, publish knowledge and successfully test your agent before continuing. If you already have, try again.";
  const neutralMessage =
    "We couldn't finish setup right now. Please try again.";
  beforeEach(() => {
    rpc.mockReset();
    vi.spyOn(console, "error").mockImplementation(logError);
    vi.mocked(requireWorkspace).mockResolvedValue({
      workspace: { id: "current-workspace" },
      supabase: { rpc },
    } as unknown as Awaited<ReturnType<typeof requireWorkspace>>);
  });
  it("persists completion through the validated RPC and enters the normal shell", async () => {
    rpc.mockResolvedValue({
      data: "2026-10-20T10:00:00Z",
      error: null,
      status: 200,
    });
    await expect(skipSetupChannel(initial)).rejects.toThrow("redirect");
    expect(rpc).toHaveBeenCalledExactlyOnceWith(
      "complete_onboarding_without_channel",
      { target_workspace_id: "current-workspace" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/app", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/onboarding");
    expect(redirect).toHaveBeenCalledWith("/app");
    expect(saveWebsiteChannel).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });
  it("shows prerequisite guidance only for the database's explicit prerequisite rejection", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "22023", message: prerequisiteDbMessage },
      status: 400,
    });
    expect(await skipSetupChannel(initial)).toEqual({
      status: "error",
      message: prerequisiteMessage,
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(logError).not.toHaveBeenCalled();
  });
  it.each([
    {
      code: "PGRST202",
      message: "Function missing from the schema cache",
      status: 404,
    },
    {
      code: "08006",
      message: "Connection failed with private connection details",
      status: 503,
    },
    {
      code: "XX000",
      message: "Unexpected internal database error",
      status: 500,
    },
    {
      code: "42501",
      message: "Permission denied for private database object",
      status: 403,
    },
    {
      code: "22023",
      message: "Unrelated invalid database parameter",
      status: 400,
    },
    { code: "22023", message: undefined, status: 400 },
    { code: "XX000", message: prerequisiteDbMessage, status: 500 },
    {
      code: "",
      message: "Fetch failed with private request information",
      status: 0,
    },
    {
      code: "private-invalid-code",
      message: "Unexpected upstream response",
      status: 502,
    },
  ])(
    "returns a neutral error and safe server diagnostics for $code / $message",
    async ({ code, message, status }) => {
      rpc.mockResolvedValue({
        data: null,
        error: {
          code,
          message,
          details: "private-error-details",
          hint: "private-error-hint",
        },
        status,
      });
      const result = await skipSetupChannel(initial);
      expect(result).toEqual({ status: "error", message: neutralMessage });
      expect(result.message).not.toBe(prerequisiteMessage);
      expect(logError).toHaveBeenCalledExactlyOnceWith(
        "onboarding.skip_channel_failed",
        {
          rpc: "complete_onboarding_without_channel",
          workspaceId: "current-workspace",
          code:
            code === "" || code === "private-invalid-code" ? "UNKNOWN" : code,
          status,
        },
      );
      const serialized = JSON.stringify([result, logError.mock.calls]);
      if (message) expect(serialized).not.toContain(message);
      expect(serialized).not.toContain("private-error-details");
      expect(serialized).not.toContain("private-error-hint");
      expect(serialized).not.toContain("private-invalid-code");
      expect(redirect).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(saveWebsiteChannel).not.toHaveBeenCalled();
      expect(rpc).toHaveBeenCalledTimes(1);
    },
  );
  it.each([
    {
      error: new TypeError("Private network endpoint or token"),
      errorType: "TypeError",
    },
    { error: new Error("Private database exception"), errorType: "Error" },
    {
      error: { message: "Private unexpected exception" },
      errorType: "UnknownError",
    },
  ])(
    "handles thrown $errorType RPC failures without leaking details",
    async ({ error, errorType }) => {
      rpc.mockRejectedValue(error);
      expect(await skipSetupChannel(initial)).toEqual({
        status: "error",
        message: neutralMessage,
      });
      expect(logError).toHaveBeenCalledExactlyOnceWith(
        "onboarding.skip_channel_failed",
        {
          rpc: "complete_onboarding_without_channel",
          workspaceId: "current-workspace",
          code: "RPC_EXCEPTION",
          errorType,
        },
      );
      expect(JSON.stringify(logError.mock.calls)).not.toContain(error.message);
      expect(redirect).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(saveWebsiteChannel).not.toHaveBeenCalled();
    },
  );
  it("preserves authentication redirects before attempting completion", async () => {
    vi.mocked(requireWorkspace).mockRejectedValueOnce(
      new Error("authentication redirect"),
    );
    await expect(skipSetupChannel(initial)).rejects.toThrow(
      "authentication redirect",
    );
    expect(rpc).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
