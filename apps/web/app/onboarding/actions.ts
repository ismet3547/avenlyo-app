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
