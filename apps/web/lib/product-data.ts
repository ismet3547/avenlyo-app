import "server-only";
import { cache } from "react";
import { z } from "zod";
import { requireWorkspace } from "./workspace";
export const productContext = cache(requireWorkspace);
const inboxItem = z.object({
  id: z.uuid(),
  channel: z.enum(["website_chat", "instagram"]),
  customerRef: z
    .string()
    .nullable()
    .transform((v) => v || "Website visitor"),
  aiMode: z.enum(["active", "paused"]),
  handoffState: z.enum(["none", "requested", "claimed"]),
  assigneeId: z.string().nullable(),
  updatedAt: z.string(),
  preview: z.string().nullable(),
  leadId: z.string().nullable(),
  qualification: z.enum(["qualified", "needs_info", "needs_human"]).nullable(),
  needsAttention: z.boolean(),
});
export const readInbox = cache(async (offset = 0) => {
  const ctx = await productContext();
  const result = await ctx.supabase.rpc("inbox_snapshot", {
    target_workspace_id: ctx.workspace.id,
    page_offset: offset,
  });
  if (result.error)
    throw new Error("Your inbox could not be loaded. Please try again.");
  return z.array(inboxItem).parse(result.data);
});
export const overviewData = cache(async () => {
  const ctx = await productContext();
  const db = ctx.supabase;
  const id = ctx.workspace.id;
  const [
    conversations,
    leads,
    qualified,
    waiting,
    channels,
    knowledge,
    settings,
    tests,
    inbox,
  ] = await Promise.all([
    db
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .neq("channel", "test_agent"),
    db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .neq("source", "test_agent"),
    db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .neq("source", "test_agent")
      .eq("qualification", "qualified"),
    db
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .neq("channel", "test_agent")
      .eq("ai_mode", "paused"),
    db.from("channel_connections").select("*").eq("workspace_id", id),
    db
      .from("knowledge_items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .eq("status", "published"),
    db.from("agent_settings").select("*").eq("workspace_id", id).single(),
    db
      .from("conversations")
      .select("id")
      .eq("workspace_id", id)
      .eq("channel", "test_agent")
      .limit(1),
    readInbox(),
  ]);
  return {
    metrics: [conversations, leads, qualified, waiting].map((v) =>
      v.error ? null : (v.count ?? 0),
    ),
    channels: channels.error ? null : channels.data,
    published: knowledge.error ? null : (knowledge.count ?? 0),
    configured: settings.error
      ? false
      : Boolean(
          settings.data.setup_brief.trim() ||
            new Date(settings.data.updated_at) >
              new Date(ctx.workspace.created_at),
        ),
    tested: !tests.error && tests.data.length > 0,
    inbox,
  };
});
