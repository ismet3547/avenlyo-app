import { agentData } from "@/lib/agents";
import { AgentLanguages } from "@/components/agent-languages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    ctx = await agentData(id);
  return (
    <AgentLanguages
      agent={ctx.agent}
      editable={ctx.role === "owner" && !ctx.agent.archived_at}
    />
  );
}
