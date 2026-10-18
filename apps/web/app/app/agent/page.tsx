import { Play } from "lucide-react";
import { agentSettingsSchema } from "@avenlyo-app/shared";
import { productContext } from "@/lib/product-data";
import { ActionLink, PageHeader, Notice } from "@/components/ui";
import { AgentForm } from "@/components/product-forms";
export default async function Page() {
  const ctx = await productContext();
  const [result, knowledge] = await Promise.all([
    ctx.supabase
      .from("agent_settings")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .single(),
    ctx.supabase
      .from("knowledge_items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "published"),
  ]);
  if (result.error)
    return (
      <Notice error>
        Your agent settings could not be loaded. Please refresh to try again.
      </Notice>
    );
  const settings = agentSettingsSchema.parse({
    tone: result.data.tone,
    goals: result.data.goals,
    contact_fields: result.data.contact_fields,
    human_handoff_enabled: result.data.human_handoff_enabled,
    setup_brief: result.data.setup_brief,
  });
  return (
    <>
      <PageHeader
        eyebrow="A NATURAL EXTENSION OF YOUR TEAM"
        title="Meet your agent."
        description="Give it a voice, a purpose and a clear way to help your customers."
        action={
          <ActionLink href="/app/test-agent" secondary>
            <Play aria-hidden="true" />
            Test your agent
          </ActionLink>
        }
      />
      <AgentForm
        settings={settings}
        editable={ctx.role === "owner"}
        published={knowledge.error ? null : (knowledge.count ?? 0)}
      />
    </>
  );
}
