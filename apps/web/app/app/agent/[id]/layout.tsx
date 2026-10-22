import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import type { ReactNode } from "react";
import { agentData } from "@/lib/agents";
import { ActionLink, Notice, PageHeader } from "@/components/ui";
import { AgentTabs } from "@/components/agent-general";
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params,
    { agent } = await agentData(id);
  return (
    <>
      <Link className="agent-back" href="/app/agent">
        <ArrowLeft size={16} aria-hidden="true" />
        Agents
      </Link>
      <PageHeader
        title={agent.name}
        description={
          agent.setup_brief ||
          "Answers customer questions and handles inquiries."
        }
        action={
          !agent.archived_at ? (
            <ActionLink href={`/app/test-agent?agent=${agent.id}`} secondary>
              <Play aria-hidden="true" />
              Test agent
            </ActionLink>
          ) : undefined
        }
      />
      {agent.archived_at && (
        <Notice>
          This agent is archived. Its conversation history is preserved.
        </Notice>
      )}
      <AgentTabs id={agent.id} />
      {children}
    </>
  );
}
