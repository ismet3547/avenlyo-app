import { agentData } from "@/lib/agents";
import { agentLanguageSummary } from "@/lib/agent-model";
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
      aria-labelledby="agent-tab-languages"
    >
      <h2>Languages</h2>
      <p>{agentLanguageSummary(ctx.agent)}</p>
    </section>
  );
}
