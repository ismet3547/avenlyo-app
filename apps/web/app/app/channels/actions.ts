"use server";
import { z } from "zod";
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
  const agentId = form.get("agent_id");
  if (agentId && !z.uuid().safeParse(agentId).success)
    return { status: "error", message: "Choose a valid agent." };
  const result = await ctx.supabase.rpc("configure_website_channel_for_agent", {
    target_agent_id: agentId ? String(agentId) : null,
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

export async function assignChannelAgent(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const value = z
    .object({ connection: z.uuid(), agent: z.uuid() })
    .safeParse({
      connection: form.get("connection_id"),
      agent: form.get("agent_id"),
    });
  if (!value.success)
    return { status: "error", message: "Choose an agent for this channel." };
  const result = await ctx.supabase.rpc("assign_channel_agent", {
    target_workspace_id: ctx.workspace.id,
    target_connection_id: value.data.connection,
    target_agent_id: value.data.agent,
  });
  if (result.error)
    return {
      status: "error",
      message:
        "Agent assignment could not be saved. Owner access and an available workspace agent are required.",
    };
  revalidatePath("/app/channels");
  revalidatePath("/app/agent");
  return {
    status: "success",
    message:
      "Agent assigned. New conversations use this agent; existing conversations keep their agent.",
  };
}
