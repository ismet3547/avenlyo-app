import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { productContext } from "./product-data";
export const agentData = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) notFound();
  const ctx = await productContext();
  const result = await ctx.supabase
    .from("agents")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .maybeSingle();
  if (result.error)
    throw new Error("This agent could not be loaded. Please try again.");
  if (!result.data) notFound();
  return { ...ctx, agent: result.data };
});
export const agentsData = cache(async () => {
  const ctx = await productContext();
  const [agents, channels] = await Promise.all([
    ctx.supabase
      .from("agents")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .order("created_at")
      .order("id"),
    ctx.supabase
      .from("channel_connections")
      .select("*")
      .eq("workspace_id", ctx.workspace.id),
  ]);
  if (agents.error || channels.error)
    throw new Error("Agents could not be loaded. Please try again.");
  return { ...ctx, agents: agents.data, channels: channels.data };
});
