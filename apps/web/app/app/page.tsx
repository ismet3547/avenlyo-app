import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Cable,
  FlaskConical,
  MessageSquare,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
export default async function Overview() {
  const { supabase, workspace } = await requireWorkspace();
  const [knowledge, conversations, qualified, human, agent, channels, tests] =
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
        .eq("ai_mode", "paused"),
      supabase
        .from("agent_settings")
        .select("setup_brief,updated_at")
        .eq("workspace_id", workspace.id)
        .single(),
      supabase
        .from("channel_connections")
        .select("channel,enabled,status,verified_at,approved_origins")
        .eq("workspace_id", workspace.id),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("channel", "test_agent"),
    ]);
  const published = knowledge.error ? null : (knowledge.count ?? 0);
  const reviewed = agent.error
    ? null
    : Boolean(
        agent.data &&
          (agent.data.setup_brief.trim() ||
            new Date(agent.data.updated_at) > new Date(workspace.created_at)),
      );
  const channelCount = channels.error
    ? null
    : channels.data.filter(
        (c) =>
          c.enabled &&
          (c.channel === "website_chat"
            ? c.approved_origins.length > 0
            : c.status === "connected" && Boolean(c.verified_at)),
      ).length;
  const steps = [
    {
      title: "Review your agent",
      description:
        "Choose its goals, tone and contact fields. Default settings already work.",
      href: "/app/agent",
      action: "Review settings",
      complete: reviewed,
      label: "Optional",
      icon: Sparkles,
    },
    {
      title: "Publish business knowledge",
      description:
        "Add a service description or FAQ. Drafts are unavailable to the agent.",
      href: published
        ? "/app/knowledge?status=published"
        : "/app/knowledge/new",
      action: published ? "Review knowledge" : "Add knowledge",
      complete: published === null ? null : published > 0,
      label: "For business answers",
      icon: BookOpen,
    },
    {
      title: "Try a customer question",
      description:
        "Check answers and lead collection in an isolated, saved test conversation.",
      href: "/app/test-agent",
      action: "Test agent",
      complete: tests.error ? null : (tests.count ?? 0) > 0,
      label: "Recommended",
      icon: FlaskConical,
    },
    {
      title: "Connect a customer channel",
      description:
        "Install Website Chat or ask your operator to connect Instagram.",
      href: "/app/channels",
      action: "Manage channels",
      complete: channelCount === null ? null : channelCount > 0,
      label: "For customer messages",
      icon: Cable,
    },
  ];
  const completed = steps.filter((step) => step.complete).length;
  const unavailable = steps.some((step) => step.complete === null);
  return (
    <>
      <PageHeader
        eyebrow={workspace.name}
        title="Your AI front office"
        description="Turn business knowledge into useful answers, and keep customer conversations close to your team."
        action={
          <Button asChild>
            <Link href="/app/inbox">
              <MessageSquare aria-hidden />
              Open Inbox
            </Link>
          </Button>
        }
      />
      <section aria-labelledby="setup-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="setup-heading" className="text-lg font-semibold">
              {completed === steps.length
                ? "Your workspace is ready"
                : "Get ready for customers"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Follow these steps at your own pace. Return here whenever you need
              to finish setup.
            </p>
          </div>
          <Badge>
            {unavailable
              ? "Some setup data unavailable"
              : `${completed} of 4 completed`}
          </Badge>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex">
              <Card className="flex w-full flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`grid size-9 place-items-center rounded-lg ${step.complete ? "bg-emerald-50 text-emerald-800" : "bg-primary/10 text-primary"}`}
                  >
                    {step.complete ? (
                      <Check aria-hidden className="size-4" />
                    ) : (
                      <step.icon aria-hidden className="size-4" />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
                <p className="mt-4 text-xs font-medium text-muted-foreground">
                  {step.complete === null
                    ? "Status unavailable"
                    : step.complete
                      ? "Completed"
                      : step.label}
                </p>
                <Link
                  href={step.href}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
                >
                  {step.action}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </Card>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-8" aria-labelledby="activity-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="activity-heading" className="text-lg font-semibold">
            Workspace activity
          </h2>
          <Badge>All channels · includes tests</Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Conversations",
              value: conversations.error ? "—" : (conversations.count ?? 0),
              href: "/app/conversations",
              icon: MessageSquare,
            },
            {
              title: "Qualified leads",
              value: qualified.error ? "—" : (qualified.count ?? 0),
              href: "/app/leads?qualification=qualified",
              icon: UsersRound,
            },
            {
              title: "Paused conversations",
              value: human.error ? "—" : (human.count ?? 0),
              href: "/app/conversations?state=paused",
              icon: UsersRound,
            },
          ].map(({ title, value, href, icon: Icon }) => (
            <Link
              href={href}
              key={title}
              className="rounded-xl transition-shadow hover:shadow-sm"
            >
              <Card className="h-full p-5">
                <p className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                  {title}
                  <Icon aria-hidden className="size-4" />
                </p>
                <p className="mt-4 text-3xl font-semibold tracking-tight">
                  {value}
                </p>
                <p className="mt-3 text-xs text-primary">View details →</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <Card className="mt-8 flex flex-wrap items-center justify-between gap-5 bg-primary/5 p-5 sm:p-6">
        <div className="max-w-2xl">
          <h2 className="font-semibold">
            {published
              ? "Keep your answers useful as your business grows."
              : "Start with the information customers ask for most."}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {published
              ? "Review published knowledge when services change. Test an answer before relying on it in customer conversations."
              : "No website is required. Add a service description and a FAQ, publish them, then try a customer question."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={published ? "/app/test-agent" : "/app/knowledge/new"}>
            {published ? "Test an answer" : "Add your first item"}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Card>
    </>
  );
}
