import Link from "next/link";
import { Sparkles } from "lucide-react";
import { agentSettingsSchema } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { AgentForm } from "@/components/agent-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
export default async function AgentPage() {
  const ctx = await requireWorkspace();
  const result = await ctx.supabase
    .from("agent_settings")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .single();
  if (result.error)
    return (
      <p>
        Agent settings are unavailable. Check your local database migrations.
      </p>
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
        eyebrow="Your agent"
        title="Helpful by design"
        description="Define how Avenlyo helps your customers, with clear goals and sensible boundaries."
        action={
          <Button asChild variant="outline">
            <Link href="/app/test-agent">
              <Sparkles aria-hidden />
              Test agent
            </Link>
          </Button>
        }
      />
      <AgentForm workspaceId={ctx.workspace.id} settings={settings} editable={ctx.role === "owner"} />
    </>
  );
}
