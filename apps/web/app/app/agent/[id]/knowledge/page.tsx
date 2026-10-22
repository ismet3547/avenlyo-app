import { agentData } from "@/lib/agents";
import { AgentKnowledge } from "@/components/agent-knowledge";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    ctx = await agentData(id);
  const [items, collections, bindings] = await Promise.all([
    ctx.supabase
      .from("knowledge_items")
      .select("id,title,status,collection_id")
      .eq("workspace_id", ctx.workspace.id)
      .order("title"),
    ctx.supabase
      .from("knowledge_collections")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .order("name"),
    ctx.supabase
      .from("agent_knowledge_items")
      .select("knowledge_item_id")
      .eq("workspace_id", ctx.workspace.id)
      .eq("agent_id", id),
  ]);
  if (items.error || collections.error || bindings.error)
    throw new Error("Knowledge scope could not be loaded.");
  return (
    <AgentKnowledge
      agent={ctx.agent}
      items={items.data}
      collections={collections.data}
      selected={bindings.data.map((b) => b.knowledge_item_id)}
      editable={ctx.role === "owner" && !ctx.agent.archived_at}
    />
  );
}
