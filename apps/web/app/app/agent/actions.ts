"use server";
import { revalidatePath } from "next/cache";
import { agentSettingsSchema, type Json } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import type { FormState } from "@/app/auth/actions";
export async function saveAgent(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
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

import { redirect } from "next/navigation";
import { z } from "zod";
import { agentIdentitySchema } from "@avenlyo-app/shared";
export async function createAgent(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const input = agentIdentitySchema.safeParse({
    name: form.get("name"),
    setup_brief: form.get("setup_brief"),
    primary_language: form.get("primary_language"),
  });
  if (!input.success)
    return {
      status: "error",
      message: input.error.issues[0]?.message ?? "Check the agent details.",
    };
  const result = await ctx.supabase.rpc("create_agent", {
    target_workspace_id: ctx.workspace.id,
    agent_name: input.data.name,
    role_brief: input.data.setup_brief,
    primary_code: input.data.primary_language,
  });
  if (result.error || !result.data)
    return {
      status: "error",
      message:
        "This agent could not be created. Please try again. Owner access is required.",
    };
  revalidatePath("/app/agent");
  redirect(`/app/agent/${result.data}`);
}
export async function saveAgentField(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const id = z.uuid().safeParse(form.get("agent_id"));
  if (!id.success)
    return {
      status: "error",
      message: "This agent is unavailable. Reload and try again.",
    };
  const current = await ctx.supabase
    .from("agents")
    .select("*")
    .eq("id", id.data)
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .maybeSingle();
  if (current.error || !current.data)
    return {
      status: "error",
      message: "This agent could not be loaded. Please try again.",
    };
  const a = current.data,
    field = form.get("field");
  let name = a.name;
  const settings = {
    tone: a.tone,
    goals: a.goals,
    contact_fields: a.contact_fields,
    human_handoff_enabled: true,
    setup_brief: a.setup_brief,
  };
  if (field === "name") name = String(form.get("name") ?? "").trim();
  else if (field === "role")
    settings.setup_brief = String(form.get("setup_brief") ?? "").trim();
  else if (field === "tone") settings.tone = form.get("tone") as typeof a.tone;
  else if (field === "goals") {
    settings.goals = [...form.getAll("goals").map(String), "human_handoff"];
    if (!settings.goals.includes("collect_contact"))
      settings.contact_fields = [];
    else if (!settings.contact_fields.length)
      settings.contact_fields = ["name", "email"];
  } else if (field === "contacts")
    settings.contact_fields = form.getAll("contact_fields").map(String);
  else return { status: "error", message: "Choose a supported setting." };
  const identity = z.string().trim().min(2).max(80).safeParse(name),
    parsed = agentSettingsSchema.safeParse(settings);
  if (!identity.success || !parsed.success)
    return {
      status: "error",
      message: !parsed.success
        ? (parsed.error.issues[0]?.message ?? "Check your settings.")
        : "Use a name between 2 and 80 characters.",
    };
  const result = await ctx.supabase.rpc("save_agent", {
    target_workspace_id: ctx.workspace.id,
    target_agent_id: id.data,
    agent_name: identity.data,
    settings: parsed.data as unknown as Json,
  });
  if (result.error)
    return {
      status: "error",
      message:
        "Changes could not be saved. Please try again. Owner access is required.",
    };
  revalidatePath("/app/agent");
  revalidatePath("/app");
  return { status: "success", message: "Changes saved." };
}
