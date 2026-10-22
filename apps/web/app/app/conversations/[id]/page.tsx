import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { productContext } from "@/lib/product-data";
import { PageHeader } from "@/components/ui";
import { TestAgent } from "@/components/conversations";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const ctx = await productContext();
  const conversation = await ctx.supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .maybeSingle();
  if (conversation.error) throw new Error("Conversation could not be loaded.");
  if (!conversation.data) notFound();
  if (conversation.data.channel !== "test_agent") redirect(`/app/inbox/${id}`);
  const agent = await ctx.supabase
    .from("agents")
    .select("id,name,archived_at")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", conversation.data.agent_id)
    .single();
  if (agent.error)
    throw new Error("The conversation agent could not be loaded.");
  const [messages, lead, knowledge] = await Promise.all([
    ctx.supabase
      .from("messages")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("conversation_id", id)
      .order("created_at")
      .order("id"),
    ctx.supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("conversation_id", id)
      .maybeSingle(),
    ctx.supabase
      .from("knowledge_items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "published"),
  ]);
  if (messages.error || lead.error)
    throw new Error("Test conversation could not be loaded.");
  return (
    <>
      <PageHeader
        title={`Testing ${agent.data.name}`}
        description="Review the answers, ask another question and keep improving."
      />
      <TestAgent
        key={id}
        workspaceId={ctx.workspace.id}
        agentId={conversation.data.agent_id}
        readOnly={Boolean(agent.data.archived_at)}
        conversationId={id}
        initialMessages={messages.data}
        initialLead={lead.data}
        paused={conversation.data.ai_mode === "paused"}
        published={knowledge.error ? null : (knowledge.count ?? 0)}
      />
    </>
  );
}
