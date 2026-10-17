import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Globe,
  MessageCircle,
  Play,
  SlidersHorizontal,
  MessageSquare,
  UsersRound,
  UserRound,
} from "lucide-react";
import type { InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConversationItem } from "@/components/conversation-item";
export default async function Overview() {
  const { supabase, workspace, user } = await requireWorkspace();
  const [knowledge, conversations, qualified, human, agent, channels, recent] =
    await Promise.all([
      supabase
        .from("knowledge_items")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("status", "published"),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("qualification", "qualified"),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("status", "needs_human"),
      supabase
        .from("agent_settings")
        .select("setup_brief,updated_at")
        .eq("workspace_id", workspace.id)
        .single(),
      supabase
        .from("channel_connections")
        .select("channel,enabled,status,verified_at,last_activity_at")
        .eq("workspace_id", workspace.id),
      supabase.rpc("inbox_snapshot", {
        target_workspace_id: workspace.id,
        page_offset: 0,
      }),
    ]);
  const published = knowledge.error ? null : (knowledge.count ?? 0);
  const configured = Boolean(
    agent.data &&
      (agent.data.setup_brief.trim() ||
        new Date(agent.data.updated_at) > new Date(workspace.created_at)),
  );
  const website = channels.data?.find((c) => c.channel === "website_chat");
  const instagram = channels.data?.find((c) => c.channel === "instagram");
  const connected = Boolean(
    instagram?.enabled &&
      instagram.status === "connected" &&
      instagram.verified_at,
  );
  const activity = recent.data as unknown as InboxItem[] | null;
  const next = !configured
    ? {
        title: "Give your agent a clear objective",
        description:
          "Choose its goals, communication style and the details it should collect.",
        href: "/app/agent",
        action: "Configure agent",
        step: "01",
      }
    : published === 0
      ? {
          title: "Give Avenlyo the information it can safely use",
          description:
            "Publish a service description or a helpful FAQ to make the first answer useful.",
          href: "/app/knowledge/new",
          action: "Add knowledge",
          step: "02",
        }
      : !website?.enabled && !channels.error
        ? {
            title: "Open the door to customer questions",
            description:
              "Approve your website’s origin and install your chat widget.",
            href: "/app/channels",
            action: "Enable Website Chat",
            step: "03",
          }
        : {
            title: "See the experience through your customer’s eyes",
            description:
              "Try a genuine question, check the answer and review the conversation outcome.",
            href: "/app/test-agent",
            action: "Test agent",
            step: "04",
          };
  const states = [
    {
      title: "Agent",
      label: agent.error
        ? "Unavailable"
        : configured
          ? "Configured"
          : "Needs setup",
      good: configured && !agent.error,
      href: "/app/agent",
      icon: SlidersHorizontal,
    },
    {
      title: "Knowledge",
      label: published === null ? "Unavailable" : `${published} published`,
      good: Boolean(published),
      href: "/app/knowledge",
      icon: BookOpen,
    },
    {
      title: "Website Chat",
      label: channels.error
        ? "Unavailable"
        : !website?.enabled
          ? "Disabled"
          : website.last_activity_at
            ? "Active"
            : "Ready",
      good: Boolean(website?.enabled),
      href: "/app/channels",
      icon: Globe,
    },
    {
      title: "Instagram",
      label: channels.error
        ? "Unavailable"
        : connected
          ? "Connected"
          : instagram?.status === "needs_attention"
            ? "Needs attention"
            : "Setup required",
      good: connected,
      href: "/app/channels",
      icon: MessageCircle,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow={workspace.name}
        title="Your AI front office"
        description="A clear view of your agent, your customers and what needs your team."
        action={
          <Button asChild>
            <Link href="/app/test-agent">
              <Play aria-hidden />
              Test agent
            </Link>
          </Button>
        }
      />
      <section
        aria-label="Operational status"
        className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4"
      >
        {states.map(({ title, label, good, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="flex items-center gap-3 bg-card p-5 transition-colors hover:bg-muted"
          >
            <Icon aria-hidden className="size-[18px] text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="mt-1 flex items-center gap-2 text-[13px] font-medium">
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${good ? "bg-success" : label === "Needs attention" ? "bg-attention" : "bg-muted-foreground/40"}`}
                />
                {label}
              </p>
            </div>
            <ArrowRight
              aria-hidden
              className="ml-auto size-3.5 text-muted-foreground"
            />
          </Link>
        ))}
      </section>
      <section className="mt-7" aria-labelledby="activity-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="activity-heading" className="panel-title">
            Workspace activity
          </h2>
          <span className="text-xs text-muted-foreground">
            All channels · includes tests
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "Conversations",
              value: conversations.error ? "—" : (conversations.count ?? 0),
              icon: MessageSquare,
            },
            {
              title: "Qualified leads",
              value: qualified.error ? "—" : (qualified.count ?? 0),
              icon: UsersRound,
            },
            {
              title: "Needs human",
              value: human.error ? "—" : (human.count ?? 0),
              icon: UserRound,
            },
          ].map(({ title, value, icon: Icon }) => (
            <Card key={title} className="p-5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{title}</span>
                <Icon aria-hidden className="size-4" />
              </div>
              <p className="mt-3 text-[32px] font-medium leading-none tracking-tight tabular-nums">
                {value}
              </p>
            </Card>
          ))}
        </div>
      </section>
      <div className="mt-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="panel-title">Recent customer activity</h2>
            <Link
              href="/app/inbox"
              className="text-xs text-primary hover:underline"
            >
              Open Inbox →
            </Link>
          </div>
          {recent.error ? (
            <Card className="p-6 text-sm text-muted-foreground">
              Recent activity is unavailable. Open Inbox to try again.
            </Card>
          ) : activity?.length ? (
            <Card className="divide-y divide-border overflow-hidden">
              {activity.slice(0, 4).map((item) => (
                <ConversationItem key={item.id} item={item} actorId={user.id} />
              ))}
            </Card>
          ) : (
            <EmptyState
              title="Customer conversations will appear here."
              description="Connect an approved website or Instagram account to bring real questions and useful inquiries into Inbox."
              action={
                <Button asChild variant="outline">
                  <Link href="/app/channels">
                    Set up a channel
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              }
            />
          )}
        </section>
        <Card className="border-success/15 bg-success-soft p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Next best action</p>
            <span className="text-xs tabular-nums text-muted-foreground">
              {next.step}
            </span>
          </div>
          <h2 className="mt-5 text-lg font-medium leading-7 tracking-tight">
            {next.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {next.description}
          </p>
          <Button asChild className="mt-5" variant="outline">
            <Link href={next.href}>
              {next.action}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <div className="mt-6 border-t border-success/15 pt-4">
            <p className="text-xs text-muted-foreground">
              Your knowledge. Your team.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
