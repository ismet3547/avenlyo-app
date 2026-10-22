import { History } from "lucide-react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionLink, PageHeader } from "@/components/ui";
import { TestAgent } from "@/components/conversations";
import { publishedAgentKnowledge } from "@/lib/agents";
import { productContext } from "@/lib/product-data";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>;
}) {
  const ctx = await productContext(),
    query = await searchParams;
  if (query.agent && !z.uuid().safeParse(query.agent).success) notFound();
  const agents = await ctx.supabase
    .from("agents")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .order("created_at");
  if (agents.error) throw new Error("Agents could not be loaded.");
  const agent = query.agent
    ? agents.data.find((a) => a.id === query.agent)
    : agents.data.find((a) => a.is_default);
  if (!agent) notFound();
  const published = await publishedAgentKnowledge(agent, ctx.supabase);
  return (
    <>
      <PageHeader
        title={`Testing ${agent.name}`}
        description="Test answers using this agent’s approved knowledge and behavior."
        action={
          <ActionLink href="/app/conversations" secondary>
            <History aria-hidden="true" />
            Test history
          </ActionLink>
        }
      />
      {agents.data.length > 1 && (
        <form method="get" className="row" style={{ marginBottom: 20 }}>
          <label htmlFor="test-agent-choice">Agent</label>
          <select
            id="test-agent-choice"
            name="agent"
            className="input"
            defaultValue={agent.id}
            style={{ width: "auto", maxWidth: "100%" }}
          >
            {agents.data.map((a) => (
              <option value={a.id} key={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button className="button button-secondary">Test agent</button>
        </form>
      )}
      <TestAgent
        key={agent.id}
        workspaceId={ctx.workspace.id}
        agentId={agent.id}
        published={published}
      />
    </>
  );
}
