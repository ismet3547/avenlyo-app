import Link from "next/link";
import {
  ArrowRight,
  Check,
  Play,
  Globe,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import type { InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { ConversationItem } from "@/components/conversation-item";

export default async function Home() {
  const { supabase, workspace, user } = await requireWorkspace();
  const [
    knowledge,
    conversations,
    qualified,
    human,
    agent,
    channels,
    recent,
    tests,
  ] = await Promise.all([
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
      .eq("qualification", "qualified")
      .in("source", ["website_chat", "instagram"]),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .in("channel", ["website_chat", "instagram"])
      .eq("ai_mode", "paused"),
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
    supabase
      .from("conversations")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("channel", "test_agent")
      .limit(1),
  ]);
  const published = knowledge.error ? null : (knowledge.count ?? 0);
  const configured = agent.error
    ? null
    : Boolean(
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
  const ready =
    configured &&
    published !== null &&
    published > 0 &&
    !channels.error &&
    (website?.enabled || connected);
  const unavailable = Boolean(agent.error || knowledge.error || channels.error);
  const activity = (recent.data as unknown as InboxItem[] | null) ?? [];
  const attention = activity.filter(
    (item) => item.aiMode === "paused" || item.needsAttention,
  );
  const steps = [
    {
      title: "Configure your agent",
      description: "Set its purpose, capabilities and contact details.",
      href: "/app/agent",
      done: configured,
    },
    {
      title: "Publish business knowledge",
      description: "Give your agent approved information to use.",
      href: "/app/knowledge",
      done: published === null ? null : published > 0,
    },
    {
      title: "Test a customer conversation",
      description: "Review an answer before customers arrive.",
      href: "/app/test-agent",
      done: tests.error ? null : Boolean(tests.data?.length),
    },
    {
      title: "Enable Website Chat",
      description: "Approve your website and install the widget.",
      href: "/app/channels",
      done: channels.error ? null : Boolean(website?.enabled),
    },
  ];
  const completed = steps.filter((step) => step.done === true).length;
  const nextIndex = steps.findIndex((step) => step.done !== true);
  const next = steps[nextIndex];
  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim().split(/\s+/)[0]
      : null;
  return (
    <div className="max-w-[1280px]">
      <header className="pb-7">
        <p className="eyebrow mb-3">
          {displayName ? "Welcome back, " + displayName : "Home"}
        </p>
        <h1 className="text-[30px] font-medium leading-tight tracking-[-.04em] sm:text-[32px]">
          Your AI front office
        </h1>
        <p className="mt-5 text-lg font-medium tracking-tight">
          {unavailable
            ? "Your setup status is temporarily unavailable."
            : ready
              ? "Ready for customer inquiries."
              : "Finish setting up your front office."}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {ready
            ? "Your connected channels use " +
              published +
              " published knowledge " +
              (published === 1 ? "item" : "items") +
              " and your saved agent settings."
            : unavailable
              ? "Open the relevant settings to check the current state."
              : "Give Avenlyo a clear purpose and approved knowledge, then connect the places customers reach you."}
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
          <Link
            href="/app/channels"
            className="flex items-center gap-2 text-[13px]"
          >
            <Globe aria-hidden className="size-4 text-muted-foreground" />
            <span
              className="status-text"
              data-tone={
                website?.enabled && !channels.error ? "success" : undefined
              }
            >
              Website Chat{" "}
              {channels.error
                ? "unavailable"
                : !website?.enabled
                  ? "disabled"
                  : website.last_activity_at
                    ? "active"
                    : "ready"}
            </span>
          </Link>
          <Link
            href="/app/channels"
            className="flex items-center gap-2 text-[13px]"
          >
            <MessageCircle
              aria-hidden
              className="size-4 text-muted-foreground"
            />
            <span
              className="status-text"
              data-tone={
                connected
                  ? "success"
                  : instagram?.status === "needs_attention"
                    ? "attention"
                    : undefined
              }
            >
              Instagram{" "}
              {channels.error
                ? "unavailable"
                : connected
                  ? "connected"
                  : instagram?.status === "needs_attention"
                    ? "needs attention"
                    : "setup required"}
            </span>
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={ready ? "/app/inbox" : (next?.href ?? "/app/agent")}>
              {ready ? "Open inbox" : (next?.title ?? "Review agent")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/app/test-agent">
              <Play aria-hidden />
              Test agent
            </Link>
          </Button>
        </div>
      </header>
      <section aria-label="Customer activity">
        <dl className="summary-strip">
          <div>
            <dt>Conversations</dt>
            <dd data-testid="customer-conversation-count">
              {conversations.error ? "—" : (conversations.count ?? 0)}
            </dd>
          </div>
          <div>
            <dt>Qualified inquiries</dt>
            <dd data-testid="customer-qualified-count">
              {qualified.error ? "—" : (qualified.count ?? 0)}
            </dd>
          </div>
          <div>
            <dt>Needs you</dt>
            <dd data-testid="customer-needs-you-count">
              {human.error ? "—" : (human.count ?? 0)}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Customer channels only · Test Agent activity is excluded.
        </p>
      </section>
      <div className="home-layout">
        <div className="min-w-0">
          <section className="home-section" aria-labelledby="attention-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="attention-heading" className="panel-title">
                Needs your attention
              </h2>
              <Link
                href="/app/inbox"
                className="text-xs font-medium text-primary hover:underline"
              >
                Open Inbox →
              </Link>
            </div>
            {recent.error || human.error ? (
              <p className="py-5 text-sm text-muted-foreground">
                Attention status is unavailable. Open Inbox to check your
                conversations.
              </p>
            ) : attention.length ? (
              <div className="divide-y divide-border border-y border-border">
                {attention.slice(0, 3).map((item) => (
                  <ConversationItem
                    key={item.id}
                    item={item}
                    actorId={user.id}
                  />
                ))}
              </div>
            ) : (human.count ?? 0) > 0 ? (
              <p className="py-5 text-sm">
                {human.count} customer conversations have AI paused. Open Inbox
                to review them.
              </p>
            ) : (
              <div className="flex items-start gap-3 py-5">
                <CheckCircle2
                  aria-hidden
                  className="mt-0.5 size-5 text-success"
                />
                <div>
                  <p className="text-sm font-medium">
                    Nothing waiting on your team.
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Customer conversations that need human assistance will
                    appear here.
                  </p>
                </div>
              </div>
            )}
          </section>
          <section className="home-section" aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="panel-title mb-3">
              Recent conversations
            </h2>
            {recent.error ? (
              <p className="py-5 text-sm text-muted-foreground">
                Recent conversations are unavailable.
              </p>
            ) : activity.length ? (
              <div className="divide-y divide-border border-y border-border">
                {activity.slice(0, 4).map((item) => (
                  <ConversationItem
                    key={item.id}
                    item={item}
                    actorId={user.id}
                  />
                ))}
              </div>
            ) : (
              <div className="border-t border-border py-6">
                <p className="text-sm font-medium">
                  Your next customer conversation starts here.
                </p>
                <p className="mt-2 max-w-md text-[13px] leading-6 text-muted-foreground">
                  Once a channel is connected, real questions and useful
                  inquiries will appear in Inbox.
                </p>
                <Link
                  href="/app/channels"
                  className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-primary"
                >
                  Connect a channel
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
            )}
          </section>
        </div>
        {completed < 4 ? (
          <section
            className="rounded-lg bg-muted px-5 py-5 sm:px-6"
            aria-labelledby="setup-heading"
          >
            <p className="eyebrow">Getting started</p>
            <h2 id="setup-heading" className="mt-2 text-base font-medium">
              Set up your AI front office
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {completed} of 4 complete
              {steps.some((step) => step.done === null)
                ? " · some setup state is unavailable"
                : ""}
            </p>
            <div
              className="mt-4 h-1 overflow-hidden rounded bg-border"
              aria-hidden
            >
              <div
                className="h-full bg-primary"
                style={{ width: completed * 25 + "%" }}
              />
            </div>
            <ol className="mt-3">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <Link href={step.href} className="setup-step">
                    <span className="setup-step-number">
                      {step.done ? (
                        <Check aria-hidden className="size-4 text-primary" />
                      ) : (
                        "0" + (i + 1)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="setup-step-title block text-[13px] font-medium">
                        {step.title}
                      </span>
                      {i === nextIndex && (
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        "text-xs " +
                        (step.done
                          ? "text-success"
                          : i === nextIndex
                            ? "text-primary font-medium"
                            : "text-muted-foreground")
                      }
                    >
                      {step.done === null
                        ? "Unavailable"
                        : step.done
                          ? "Done"
                          : i === nextIndex
                            ? "Next"
                            : "Later"}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <aside className="border-t border-border pt-5">
            <p className="eyebrow">Your front office</p>
            <h2 className="mt-2 text-base font-medium">
              Set up. Ready for real questions.
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
              Keep your published knowledge current and review customer
              conversations when your team is needed.
            </p>
            <Link
              href="/app/knowledge"
              className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-primary"
            >
              Review knowledge
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
