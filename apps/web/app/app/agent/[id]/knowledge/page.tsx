import { agentData } from "@/lib/agents";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    ctx = await agentData(id);
  return (
    <section
      className="agent-section"
      role="tabpanel"
      id="agent-panel"
      aria-labelledby="agent-tab-knowledge"
    >
      <h2>Knowledge</h2>
      <p>Choose what this agent can use when answering customers.</p>
      <p>
        {ctx.agent.knowledge_mode === "all"
          ? "All published knowledge"
          : "Selected knowledge"}
      </p>
    </section>
  );
}
