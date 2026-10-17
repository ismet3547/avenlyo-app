import Link from "next/link";
import { Play } from "lucide-react";
import { agentSettingsSchema } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { AgentForm } from "@/components/agent-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
export default async function AgentPage() {
  const ctx = await requireWorkspace();
  const [result, knowledge, channels] = await Promise.all([
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
    ctx.supabase
      .from("channel_connections")
      .select("channel,enabled,status,verified_at,last_activity_at")
      .eq("workspace_id", ctx.workspace.id),
  ]);
  if (result.error)
    return <p>Agent settings are unavailable. Please try again.</p>;
  const settings = agentSettingsSchema.parse({
    tone: result.data.tone,
    goals: result.data.goals,
    contact_fields: result.data.contact_fields,
    human_handoff_enabled: result.data.human_handoff_enabled,
    setup_brief: result.data.setup_brief,
  });
  const configured = Boolean(
    result.data.setup_brief.trim() ||
    new Date(result.data.updated_at) > new Date(ctx.workspace.created_at),
  );
  const website = channels.data?.find((c) => c.channel === "website_chat");
  const instagram = channels.data?.find((c) => c.channel === "instagram");
  const channelSummary = [
    {
      name: "Website Chat",
      state: channels.error
        ? "Unavailable"
        : website?.enabled
          ? website.last_activity_at
            ? "Active"
            : "Ready"
          : "Disabled",
    },
    {
      name: "Instagram",
      state: channels.error
        ? "Unavailable"
        : instagram?.enabled &&
            instagram.status === "connected" &&
            instagram.verified_at
          ? "Connected"
          : instagram?.status === "needs_attention"
            ? "Needs attention"
            : "Setup required",
    },
  ];
  return (
    <>
      <PageHeader
        title="Agent"
        description="Configure your AI front office. These settings guide how Avenlyo responds to customers."
        action={
          <Button asChild variant="outline">
            <Link href="/app/test-agent">
              <Play aria-hidden />
              Test agent
            </Link>
          </Button>
        }
      />
      <p
        className="status-text mb-7"
        data-tone={configured ? "success" : undefined}
      >
        {configured ? "Configured" : "Needs setup"}
      </p>
      <AgentForm
        settings={settings}
        editable={ctx.role === "owner"}
        published={knowledge.error ? null : (knowledge.count ?? 0)}
        channels={channelSummary}
      />
    </>
  );
}
