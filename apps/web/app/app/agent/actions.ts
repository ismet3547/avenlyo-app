"use server";
import { revalidatePath } from "next/cache";
import { agentSettingsSchema, type Json } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { workspaceFormError } from "@/lib/workspace-form";
import type { FormState } from "@/app/auth/actions";
export async function saveAgent(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const workspaceError = workspaceFormError(form, ctx.workspace.id);
  if (workspaceError) return workspaceError;
  const parsed = agentSettingsSchema.safeParse({
    tone: form.get("tone"),
    goals: [...form.getAll("goals"), "human_handoff"],
    contact_fields: form.getAll("contact_fields"),
    human_handoff_enabled: true,
    setup_brief: form.get("setup_brief"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your settings.",
    };
  const result = await ctx.supabase.rpc("save_agent_settings", {
    target_workspace_id: ctx.workspace.id,
    settings: parsed.data as unknown as Json,
  });
  if (result.error)
    return {
      status: "error",
      message: "Settings could not be saved. Owner access is required.",
    };
  revalidatePath("/app/agent");
  revalidatePath("/app");
  return { status: "success", message: "Agent settings saved." };
}
