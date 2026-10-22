import { agentData } from "@/lib/agents";
import { AgentGeneral } from "@/components/agent-general";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    ctx = await agentData(id);
  return (
    <AgentGeneral
      agent={ctx.agent}
      editable={ctx.role === "owner" && !ctx.agent.archived_at}
    />
  );
}
