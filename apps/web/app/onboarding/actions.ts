"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveAgent } from "@/app/app/agent/actions";
import { saveWebsiteChannel } from "@/app/app/channels/actions";
import type { FormState } from "@/app/auth/actions";
import { requireWorkspace } from "@/lib/workspace";

export async function saveSetupAgent(
  state: FormState,
  form: FormData,
): Promise<FormState> {
  const result = await saveAgent(state, form);
  if (result.status !== "success") return result;
  revalidatePath("/onboarding");
  redirect("/onboarding?step=knowledge");
}
export async function activateSetupWebsite(
  state: FormState,
  form: FormData,
): Promise<FormState> {
  const result = await saveWebsiteChannel(state, form);
  if (result.status !== "success") return result;
  const ctx = await requireWorkspace();
  const progress = await ctx.supabase.rpc("sync_onboarding", {
    target_workspace_id: ctx.workspace.id,
  });
  if (progress.error)
    return {
      status: "error",
      message: "Your channel was saved. Refresh to check setup progress.",
    };
  revalidatePath("/onboarding");
  revalidatePath("/app", "layout");
  redirect("/onboarding");
}

export async function skipSetupChannel(_state: FormState): Promise<FormState> {
  void _state;
  const ctx = await requireWorkspace();
  const failure: FormState = {
    status: "error",
    message: "We couldn't finish setup right now. Please try again.",
  };
  let result;
  try {
    result = await ctx.supabase.rpc("complete_onboarding_without_channel", {
      target_workspace_id: ctx.workspace.id,
    });
  } catch (error) {
    console.error("onboarding.skip_channel_failed", {
      rpc: "complete_onboarding_without_channel",
      workspaceId: ctx.workspace.id,
      code: "RPC_EXCEPTION",
      errorType:
        error instanceof TypeError
          ? "TypeError"
          : error instanceof Error
            ? "Error"
            : "UnknownError",
    });
    return failure;
  }
  if (result.error) {
    // SQLSTATE 22023 alone is not specific to missing setup prerequisites.
    // Match the explicit rejection from the existing completion RPC.
    if (
      result.error.code === "22023" &&
      result.error.message ===
        "Complete agent, published knowledge and a successful real test first"
    )
      return {
        status: "error",
        message:
          "Complete agent setup, publish knowledge and successfully test your agent before continuing. If you already have, try again.",
      };
    // Keep diagnostics on the server; omit raw messages, details and hints.
    console.error("onboarding.skip_channel_failed", {
      rpc: "complete_onboarding_without_channel",
      workspaceId: ctx.workspace.id,
      code: /^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(result.error.code)
        ? result.error.code
        : "UNKNOWN",
      status: result.status,
    });
    return failure;
  }
  revalidatePath("/onboarding");
  revalidatePath("/app", "layout");
  redirect("/app");
}
