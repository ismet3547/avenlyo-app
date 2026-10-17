"use server";
import { revalidatePath } from "next/cache";
import { websiteConfigurationSchema } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import type { FormState } from "@/app/auth/actions";
export async function saveWebsiteChannel(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const parsed = websiteConfigurationSchema.safeParse({
    enabled: form.get("enabled") === "on",
    origins: String(form.get("origins") ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  });
  if (!parsed.success)
    return {
      status: "error",
      message:
        "Add up to ten unique, exact HTTPS origins. HTTP localhost is allowed for a local demo.",
    };
  const result = await ctx.supabase.rpc("configure_website_channel", {
    target_workspace_id: ctx.workspace.id,
    channel_enabled: parsed.data.enabled,
    origins: parsed.data.origins,
  });
  if (result.error)
    return {
      status: "error",
      message:
        "Could not save this channel. Workspace owner access and exact origins are required.",
    };
  revalidatePath("/app/channels");
  return {
    status: "success",
    message: parsed.data.enabled
      ? "Website Chat is ready on the approved origins."
      : "Website Chat is disabled.",
  };
}
export async function disconnectInstagram(
  _state: FormState,
): Promise<FormState> {
  void _state;
  const ctx = await requireWorkspace();
  const result = await ctx.supabase.rpc("disconnect_instagram_channel", {
    target_workspace_id: ctx.workspace.id,
  });
  if (result.error)
    return {
      status: "error",
      message: "Could not disconnect. Workspace owner access is required.",
    };
  revalidatePath("/app/channels");
  return {
    status: "success",
    message:
      "Instagram disconnected and the stored token removed. Revoke the app in Instagram to remove provider access.",
  };
}
