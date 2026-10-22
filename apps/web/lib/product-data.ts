import "server-only";
import { cache } from "react";
import { z } from "zod";
import { homeSchema } from "./home-model";
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
  const [snapshot, channels] = await Promise.all([
    ctx.supabase.rpc("home_snapshot", {
      target_workspace_id: ctx.workspace.id,
    }),
    ctx.supabase
      .from("channel_connections")
      .select("*")
      .eq("workspace_id", ctx.workspace.id),
  ]);
  if (snapshot.error || channels.error)
    throw new Error("Home could not be loaded. Please try again.");
  return {
    ...homeSchema.parse(snapshot.data),
    channels: channels.data,
    firstChannelActivatedAt: ctx.workspace.first_channel_activated_at,
  };
});
