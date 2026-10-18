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
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
        title="Your AI front office"
        description="A little clarity for every customer conversation."
        action={
          <Button variant="outline" asChild>
            <Link href="/app/test-agent">
              <FlaskConical aria-hidden />
              Test agent
            </Link>
          </Button>
        }
      />
      <section className="home-hero">
        <div className="relative z-1 max-w-lg">
          <p className="eyebrow !text-primary">
            {active
              ? "Your workspace, at a glance"
              : "Make a helpful first impression"}
          </p>
          <h2 className="text-[28px] font-medium leading-[1.22] tracking-[-.045em] sm:text-[34px]">
            {active ? (
              waiting ? (
                `${waiting} conversation${waiting === 1 ? " needs" : "s need"} a human touch.`
              ) : (
                "More room for the conversations that matter."
              )
            ) : (
              <>
                Good answers.
                <br />
                Better conversations.
              </>
            )}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
            {active
              ? "Pick up customer questions, review new inquiries, and keep your agent ready for the next conversation."
              : "Give your agent the knowledge to help customers. Try it yourself, then open the door on your website or Instagram."}
          </p>
          <Button asChild className="mt-6">
            <Link href={active ? "/app/inbox" : "/app/knowledge/new"}>
              {active ? "Open Inbox" : "Add business knowledge"}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="relative z-1 hidden w-60 self-center rounded-xl border border-white bg-white/85 p-5 shadow-[0_8px_30px_#264d3610] xl:block">
          <span className="mb-4 inline-flex items-center gap-2 text-[11px] font-medium text-primary">
            <span className="status-dot" />
            Built around your business
          </span>
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
              <BookOpen className="size-4" aria-hidden />
            </span>
            <p className="text-xs leading-6 text-muted-foreground">
              Your knowledge becomes a helpful starting point for every answer.
            </p>
          </div>
          <div className="my-4 h-px bg-border" />
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
              <UsersRound className="size-4" aria-hidden />
            </span>
            <p className="text-xs leading-6 text-muted-foreground">
              Your team stays in control when a person is needed.
            </p>
          </div>
        </div>
      </section>
      <div className="mb-8 mt-5 overflow-hidden rounded-xl border border-border bg-white sm:grid sm:grid-cols-3">
        {[
          {
            label: "Customer conversations",
            value: conversations.error ? "—" : (conversations.count ?? 0),
            icon: MessageSquare,
            href: "/app/inbox",
          },
          {
            label: "Qualified leads",
            value: qualified.error ? "—" : (qualified.count ?? 0),
            icon: UsersRound,
            href: "/app/leads?qualification=qualified",
          },
          {
            label: "AI paused · needs your team",
            value: waiting ?? "—",
            icon: Inbox,
            href: "/app/inbox",
          },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="home-metric group">
            <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              {label}
              <Icon className="size-4" aria-hidden />
            </p>
            <p className="mt-3 text-[30px] font-medium tracking-tight">
              {value}
              <ArrowUpRight
                className="ml-2 inline size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </p>
          </Link>
        ))}
      </div>
      <p className="-mt-5 mb-8 text-[11px] text-muted-foreground">
        Customer activity across Website Chat and Instagram. Test Agent data is
        excluded.
      </p>
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">
              {active ? "Recent conversations" : "Get your front office ready"}
            </h2>
            {active && (
              <Link
                href="/app/inbox"
                className="text-xs font-medium text-primary"
              >
                View Inbox{" "}
                <ArrowUpRight className="inline size-3" aria-hidden />
              </Link>
            )}
          </div>
          <Card className="overflow-hidden">
            {recent.error && active ? (
              <p role="alert" className="p-6 text-sm text-muted-foreground">
                Recent conversations are temporarily unavailable.
              </p>
            ) : active ? (
              items.map((c) => (
                <Link
                  href={`/app/inbox/${c.id}`}
                  key={c.id}
                  className="checklist-row hover:bg-muted/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
                    <MessageSquare
                      className="size-4 text-primary"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">
                      {customerLabel(c.channel, c.customerRef)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {c.preview ?? "Waiting for the first message"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-muted-foreground">
                      {dateLabel(c.updatedAt)}
                    </p>
                    <p
                      className={`mt-1 text-[11px] ${c.aiMode === "paused" ? "text-amber-700" : "text-primary"}`}
                    >
                      {c.aiMode === "paused" ? "AI paused" : "AI active"}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              [
                {
                  title: "Give your agent a direction",
                  text: "Choose goals, tone and the details to collect.",
                  href: "/app/agent",
                  complete: false,
                },
                {
                  title: "Add what your customers need to know",
                  text: published
                    ? `${published} published item${published === 1 ? "" : "s"} available to your agent.`
                    : "Start with a service description or a useful FAQ.",
                  href: "/app/knowledge",
                  complete: Boolean(published),
                },
                {
                  title: "Have a practice conversation",
                  text: "See how saved settings and published knowledge work.",
                  href: "/app/test-agent",
                  complete: false,
                },
              ].map((step, i) => (
                <Link
                  href={step.href}
                  key={step.href}
                  className="checklist-row hover:bg-muted/40"
                >
                  <span
                    className={`step-number ${step.complete ? "status-success" : ""}`}
                  >
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
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              ))
            )}
          </Card>
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Ready to meet your customers</h2>
            <Link
              href="/app/channels"
              className="text-xs font-medium text-primary"
            >
              Manage
            </Link>
          </div>
          <Card className="p-5">
            {channels.error ? (
              <p role="alert" className="text-xs text-muted-foreground">
                Channel status is unavailable.
              </p>
            ) : (
              <div className="space-y-5">
                {[
                  {
                    label: "Website Chat",
                    icon: Globe,
                    state: website?.enabled
                      ? website.last_activity_at
                        ? "Active"
                        : "Ready"
                      : "Disabled",
                    good: website?.enabled,
                  },
                  {
                    label: "Instagram",
                    icon: MessageSquare,
                    state: instagramConnected
                      ? "Connected"
                      : instagram?.status === "needs_attention"
                        ? "Needs attention"
                        : "Setup needed",
                    good: instagramConnected,
                  },
                ].map(({ label, icon: Icon, state, good }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="flex-1 text-xs font-medium">{label}</span>
                    <Badge className={good ? "status-success" : ""}>
                      <span className="status-dot" />
                      {state}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
              One agent, shared knowledge. Customer messages arrive together in
              Inbox.
            </p>
          </Card>
          <Link
            href="/app/knowledge"
            className="mt-4 flex items-center gap-3 rounded-xl border border-border px-5 py-4 text-xs hover:bg-white"
          >
            <Sparkles className="size-4 text-primary" aria-hidden />
            <span className="flex-1">
              {published === null
                ? "Review your knowledge"
                : `${published} published knowledge item${published === 1 ? "" : "s"}`}
            </span>
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      </div>
    </>
  );
}
