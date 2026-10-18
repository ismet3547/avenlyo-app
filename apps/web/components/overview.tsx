import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  Clock3,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { ChannelConnection, InboxItem } from "@avenlyo-app/shared";
import {
  ActionLink,
  Avatar,
  Badge,
  ChannelIcon,
  EmptyState,
  PageHeader,
  Panel,
  Step,
} from "./ui";
import { dateLabel, screenHref } from "@/lib/presentation";
export type OverviewModel = {
  metrics: (number | null)[];
  channels: ChannelConnection[] | null;
  published: number | null;
  configured: boolean;
  tested: boolean;
  inbox: InboxItem[];
};
export function Overview({
  name,
  data,
  preview = false,
}: {
  name: string;
  data: OverviewModel;
  preview?: boolean;
}) {
  const href = (path: string) => screenHref(path, preview);
  const website = data.channels?.find((c) => c.channel === "website_chat");
  const instagram = data.channels?.find((c) => c.channel === "instagram");
  const websiteReady = Boolean(website?.enabled);
  const instagramReady = Boolean(
    instagram?.enabled &&
      instagram.status === "connected" &&
      instagram.verified_at,
  );
  const steps = [
    {
      title: "Make your agent your own",
      description: "Set its voice, goals and instructions",
      done: data.configured,
      href: "/app/agent",
    },
    {
      title: "Share what you know",
      description: "Add your services, FAQs and business details",
      done: (data.published ?? 0) > 0,
      href: "/app/knowledge",
    },
    {
      title: "Try a conversation",
      description: "See how your agent helps a customer",
      done: data.tested,
      href: "/app/test-agent",
    },
    {
      title: "Meet your customers",
      description: "Connect your website to start conversations",
      done: websiteReady,
      href: "/app/channels",
    },
  ];
  const completed = steps.filter((s) => s.done).length;
  const metrics = [
    {
      label: "Conversations",
      icon: MessageSquare,
      note: "Customer conversations",
      tone: "",
    },
    {
      label: "Leads captured",
      icon: UsersRound,
      note: "People worth following up with",
      tone: "",
    },
    {
      label: "Qualified leads",
      icon: CheckCheck,
      note: "Ready for the next step",
      tone: "metric-success",
    },
    {
      label: "Needs your attention",
      icon: Clock3,
      note: "Waiting for a human touch",
      tone: (data.metrics[3] ?? 0) > 0 ? "metric-attention" : "",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="YOUR WORKSPACE, AT A GLANCE"
        title="A little clarity for your day."
        description={`Welcome to ${name}. Here’s what’s happening with your AI front office.`}
        action={
          <ActionLink href={href("/app/test-agent")} secondary>
            <Sparkles aria-hidden="true" />
            Test your agent
            <ArrowUpRight aria-hidden="true" />
          </ActionLink>
        }
      />
      <div className="metrics-grid">
        {metrics.map(({ label, icon: Icon, note, tone }, i) => (
          <Panel className="metric" key={label}>
            <div className="metric-header">
              <span>{label}</span>
              <span className="metric-icon">
                <Icon aria-hidden="true" />
              </span>
            </div>
            <p
              className="metric-value"
              data-testid={
                [
                  "customer-conversation-count",
                  "customer-lead-count",
                  "customer-qualified-count",
                  "customer-needs-you-count",
                ][i]
              }
            >
              {data.metrics[i] === null
                ? "—"
                : data.metrics[i]?.toLocaleString()}
            </p>
            <p className="metric-footer">
              <span className={tone}>
                {data.metrics[i] === null ? "Temporarily unavailable" : note}
              </span>
            </p>
          </Panel>
        ))}
      </div>
      <div
        className={`dashboard-grid ${data.metrics[0] === 0 && completed < 4 ? "is-onboarding" : ""}`}
      >
        <div className="stack">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <h2>
                {completed < 4
                  ? "Your next great conversation starts here."
                  : "Your front office, working together."}
              </h2>
              <p>
                {completed < 4
                  ? "A few thoughtful details help your agent feel like a natural part of your team."
                  : "Keep your knowledge fresh and your agent ready. Your team is always in control."}
              </p>
              <Link
                href={href(
                  completed < 4
                    ? steps.find((s) => !s.done)!.href
                    : "/app/knowledge",
                )}
                className="text-link"
              >
                {completed < 4
                  ? "Continue setting up"
                  : "Review your knowledge"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="banner-art" aria-hidden="true">
              <span className="banner-orbit" />
              <span className="banner-orbit" />
              <span className="banner-core">
                <Sparkles />
              </span>
              <span className="banner-spark">
                <Sparkles />
              </span>
            </div>
          </section>
          <Panel
            title="Recent conversations"
            description="The latest from your customers."
            action={
              <Link href={href("/app/inbox")} className="text-link">
                View inbox
                <ArrowUpRight aria-hidden="true" />
              </Link>
            }
          >
            {data.inbox.length ? (
              <ul className="data-list">
                {data.inbox.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link
                      className="conversation-row"
                      href={href(`/app/inbox/${item.id}`)}
                    >
                      <Avatar name={item.customerRef || "Visitor"} />
                      <div className="conversation-copy">
                        <div className="conversation-title">
                          <strong>
                            {item.customerRef || "Website visitor"}
                          </strong>
                          <Badge
                            tone={
                              item.aiMode === "paused" ? "warning" : "success"
                            }
                            dot
                          >
                            {item.aiMode === "paused"
                              ? "Needs your help"
                              : "AI handling"}
                          </Badge>
                        </div>
                        <p>{item.preview || "A new conversation is ready."}</p>
                      </div>
                      <time
                        className="conversation-date"
                        dateTime={item.updatedAt}
                      >
                        {dateLabel(item.updatedAt)}
                      </time>
                      <ChannelIcon channel={item.channel} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Your conversations will feel at home here"
                description="Connect a channel and your customer conversations will appear in one calm, organized inbox."
                action={
                  <ActionLink secondary href={href("/app/channels")}>
                    Connect a channel
                    <ArrowRight aria-hidden="true" />
                  </ActionLink>
                }
              />
            )}
            <div className="list-footer">
              <span>Customer activity · test conversations excluded</span>
              <span className="section-note">
                <ShieldCheck aria-hidden="true" />
                Your team stays in control
              </span>
            </div>
          </Panel>
          <Panel className="insight-panel">
            <p className="insight-icon">
              <Sparkles aria-hidden="true" />A SMALL IDEA, A BETTER EXPERIENCE
            </p>
            <h3>Your agent is only as helpful as what it knows.</h3>
            <p>
              A clear answer to a common question can save your team time, every
              single day. Start with the questions you hear most.
            </p>
            <Link href={href("/app/knowledge/new")} className="text-link">
              Add your next piece of knowledge
              <ArrowRight aria-hidden="true" />
            </Link>
          </Panel>
        </div>
        <div className="stack">
          <Panel>
            <div className="setup-heading">
              <div className="row space-between">
                <h2>Your launch checklist</h2>
                <Badge tone="accent">{completed} of 4</Badge>
              </div>
              <p>
                {completed === 4
                  ? "All set. You’re ready for better conversations."
                  : "Small steps. A more helpful front office."}
              </p>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Launch setup"
                aria-valuenow={completed}
                aria-valuemin={0}
                aria-valuemax={4}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${completed * 25}%` }}
                />
              </div>
            </div>
            <div className="setup-list">
              {steps.map((step, i) => (
                <Step
                  key={step.title}
                  {...step}
                  number={i + 1}
                  href={href(step.href)}
                />
              ))}
            </div>
          </Panel>
          <Panel
            title="Your channels"
            action={
              <Link href={href("/app/channels")} className="text-link">
                Manage
                <ArrowUpRight aria-hidden="true" />
              </Link>
            }
          >
            <div className="channel-row">
              <ChannelIcon channel="website_chat" />
              <div>
                <strong>Website Chat</strong>
                <p>
                  {websiteReady
                    ? "Ready to welcome your visitors"
                    : "Bring your website to life"}
                </p>
              </div>
              <Badge
                dot
                tone={
                  data.channels === null
                    ? "neutral"
                    : websiteReady
                      ? "success"
                      : "neutral"
                }
              >
                {data.channels === null
                  ? "Unavailable"
                  : websiteReady
                    ? "Ready"
                    : "Not connected"}
              </Badge>
            </div>
            <div className="channel-row">
              <ChannelIcon channel="instagram" />
              <div>
                <strong>Instagram</strong>
                <p>
                  {instagramReady
                    ? `@${instagram?.provider_username || "Connected"}`
                    : "Be there in their DMs"}
                </p>
              </div>
              <Badge
                dot
                tone={
                  instagramReady
                    ? "success"
                    : instagram?.status === "needs_attention"
                      ? "warning"
                      : "neutral"
                }
              >
                {data.channels === null
                  ? "Unavailable"
                  : instagramReady
                    ? "Connected"
                    : instagram?.status === "needs_attention"
                      ? "Needs attention"
                      : "Not connected"}
              </Badge>
            </div>
            <div className="channel-panel-footer">
              <p className="section-note">
                <MessageSquare aria-hidden="true" />
                One agent. Every conversation in one place.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
