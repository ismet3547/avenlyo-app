import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  FlaskConical,
  Globe,
  Inbox,
  MessageSquare,
} from "lucide-react";
import type { InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { dateLabel } from "@/lib/utils";
import { customerLabel } from "@/lib/inbox";

export default async function Overview() {
  const { supabase, workspace } = await requireWorkspace();
  const [knowledge, conversations, qualified, human, channels, recent] =
    await Promise.all([
      supabase
        .from("knowledge_items")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("status", "published"),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .in("channel", ["website_chat", "instagram"]),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .in("source", ["website_chat", "instagram"])
        .eq("qualification", "qualified"),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .in("channel", ["website_chat", "instagram"])
        .eq("ai_mode", "paused"),
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
  const active = !conversations.error && (conversations.count ?? 0) > 0;
  const waiting = human.error ? null : (human.count ?? 0);
  const items =
    (recent.data as unknown as InboxItem[] | null)?.slice(0, 4) ?? [];
  const website = channels.data?.find((c) => c.channel === "website_chat");
  const instagram = channels.data?.find((c) => c.channel === "instagram");
  const instagramConnected =
    instagram?.enabled &&
    instagram.status === "connected" &&
    Boolean(instagram.verified_at);
  return (
    <>
      <PageHeader
        eyebrow={workspace.name}
        title="Overview"
        description="Customer activity and workspace setup."
        action={
          <Button variant={active ? "default" : "outline"} asChild>
            <Link href={active ? "/app/inbox" : "/app/test-agent"}>
              {active ? <Inbox aria-hidden /> : <FlaskConical aria-hidden />}
              {active ? "Open Inbox" : "Test agent"}
            </Link>
          </Button>
        }
      />
      {active && (
        <>
          <section className="overview-metrics" aria-label="Customer activity">
            {[
              {
                label: "Customer conversations",
                value: conversations.error ? "—" : (conversations.count ?? 0),
                href: "/app/inbox",
              },
              {
                label: "Qualified leads",
                value: qualified.error ? "—" : (qualified.count ?? 0),
                href: "/app/leads?qualification=qualified",
              },
              { label: "AI paused", value: waiting ?? "—", href: "/app/inbox" },
            ].map(({ label, value, href }) => (
              <Link key={label} href={href} className="home-metric">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="mt-3 block text-[28px] font-medium tabular-nums tracking-tight">
                  {value}
                </span>
              </Link>
            ))}
          </section>
          <p className="mb-9 mt-3 text-[11px] text-muted-foreground">
            Website Chat and Instagram · Test Agent excluded
          </p>
        </>
      )}
      <div className="overview-columns">
        <section>
          <div className="section-heading">
            <h2 className="section-title">
              {active ? "Recent conversations" : "Workspace setup"}
            </h2>
            {active && (
              <Link href="/app/inbox" className="quiet-link">
                View all
                <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            )}
          </div>
          {conversations.error && (
            <p role="alert" className="mb-4 text-xs text-muted-foreground">
              Customer activity is temporarily unavailable.
            </p>
          )}
          {active ? (
            <div className="data-list">
              {recent.error ? (
                <p role="alert" className="py-6 text-sm text-muted-foreground">
                  Recent conversations could not be loaded.
                </p>
              ) : (
                items.map((c) => (
                  <Link
                    href={`/app/inbox/${c.id}`}
                    key={c.id}
                    className="overview-conversation"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                      <MessageSquare className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {customerLabel(c.channel, c.customerRef)}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {c.preview ?? "Waiting for the first message"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <time
                        dateTime={c.updatedAt}
                        className="text-[11px] text-muted-foreground"
                      >
                        {dateLabel(c.updatedAt)}
                      </time>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {c.aiMode === "paused" ? "AI paused" : "AI active"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ) : (
            <div className="data-list">
              {[
                {
                  title: "Configure your agent",
                  text: "Set goals, tone and contact requirements.",
                  href: "/app/agent",
                  complete: false,
                },
                {
                  title: "Add business knowledge",
                  text: published
                    ? `${published} published item${published === 1 ? "" : "s"}`
                    : "Publish a service description or FAQ.",
                  href: "/app/knowledge",
                  complete: Boolean(published),
                },
                {
                  title: "Run a test conversation",
                  text: "Check the answers before connecting a channel.",
                  href: "/app/test-agent",
                  complete: false,
                },
              ].map((step, i) => (
                <Link
                  href={step.href}
                  key={step.href}
                  className="checklist-row"
                >
                  <span className="step-number">
                    {step.complete ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      `0${i + 1}`
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                  <ArrowRight
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          )}
          {!active && (
            <div className="mt-7 flex items-start gap-3 text-xs leading-6 text-muted-foreground">
              <Inbox className="mt-1 size-4 shrink-0" aria-hidden />
              <p>
                Customer conversations will appear here after you connect a
                channel.
              </p>
            </div>
          )}
        </section>
        <aside className="overview-aside">
          <div className="section-heading">
            <h2 className="section-title">Channels</h2>
            <Link href="/app/channels" className="quiet-link">
              Manage
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>
          <div className="data-list">
            {channels.error ? (
              <p role="alert" className="py-5 text-xs text-muted-foreground">
                Channel status is unavailable.
              </p>
            ) : (
              [
                {
                  label: "Website Chat",
                  icon: Globe,
                  state: website?.enabled
                    ? website.last_activity_at
                      ? "Active"
                      : "Ready"
                    : "Disabled",
                },
                {
                  label: "Instagram",
                  icon: MessageSquare,
                  state: instagramConnected
                    ? "Connected"
                    : instagram?.status === "needs_attention"
                      ? "Needs attention"
                      : "Setup required",
                },
              ].map(({ label, icon: Icon, state }) => (
                <Link
                  href="/app/channels"
                  key={label}
                  className="channel-summary"
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="flex-1 text-[13px]">{label}</span>
                  <span className="text-xs text-muted-foreground">{state}</span>
                </Link>
              ))
            )}
          </div>
          <div className="mt-9">
            <div className="section-heading">
              <h2 className="section-title">Knowledge</h2>
            </div>
            <Link
              href="/app/knowledge"
              className="channel-summary border-y border-border"
            >
              <BookOpen className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-[13px]">
                {published === null
                  ? "Unavailable"
                  : `${published} published item${published === 1 ? "" : "s"}`}
              </span>
              <ArrowUpRight
                className="size-3.5 text-muted-foreground"
                aria-hidden
              />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
