import { AgentNavigation } from "@/components/agent-navigation";
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
        Agent settings are temporarily unavailable. Refresh this page to try
        again.
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
        title="Make your agent feel like your business"
        description="Choose its goals, voice and the details that make an inquiry useful."
        action={
          <Button asChild variant="outline">
            <Link href="/app/test-agent">
              <Sparkles aria-hidden />
              Test saved settings
            </Link>
          </Button>
        }
      />
      <AgentNavigation active="settings" />
      <AgentForm settings={settings} editable={ctx.role === "owner"} />
    </>
  );
}
