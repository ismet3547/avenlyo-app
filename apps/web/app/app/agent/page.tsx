import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { channelLabels } from "@avenlyo-app/shared";
import { agentsData } from "@/lib/agents";
import { agentLanguageSummary, agentStatus } from "@/lib/agent-model";
import { Badge, PageHeader } from "@/components/ui";
import { CreateAgent } from "@/components/agent-general";
export default async function Page() {
  const ctx = await agentsData();
  return (
    <>
      <PageHeader
        title="Agents"
        description="Create and manage the AI agents that talk with customers."
        action={ctx.role === "owner" ? <CreateAgent /> : undefined}
      />
      <div className="agent-library">
        {ctx.agents.map((agent) => {
          const channels = ctx.channels.filter((c) => c.agent_id === agent.id);
          const status = agentStatus(channels);
          return (
            <Link
              className="agent-library-row"
              key={agent.id}
              href={`/app/agent/${agent.id}`}
            >
              <div>
                <h2>{agent.name}</h2>
                <p>
                  {agent.setup_brief ||
                    "Answers customer questions and handles inquiries."}
                </p>
                <div className="agent-row-summary">
                  <span>{agentLanguageSummary(agent)}</span>
                  <span>
                    {agent.knowledge_mode === "all"
                      ? "All published knowledge"
                      : "Selected knowledge"}
                  </span>
                  <span>
                    {channels.length
                      ? channels.map((c) => channelLabels[c.channel]).join(", ")
                      : "Not connected"}
                  </span>
                </div>
              </div>
              <div className="agent-row-status">
                <Badge
                  tone={
                    status === "Live"
                      ? "success"
                      : status === "Issue"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {status}
                </Badge>
                <ArrowRight aria-hidden="true" size={18} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
