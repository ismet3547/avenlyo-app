import Link from "next/link";
import { ArrowRight, Inbox, Plus } from "lucide-react";
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
  const websiteReady = Boolean(
    data.channels?.find((c) => c.channel === "website_chat")?.enabled,
  );
  const steps = [
    {
      title: "Configure your agent",
      description: "Instructions and tone",
      done: data.configured,
      href: "/app/agent",
    },
    {
      title: "Add knowledge",
      description: "Give your agent answers",
      done: (data.published ?? 0) > 0,
      href: "/app/knowledge",
    },
    {
      title: "Test a conversation",
      description: "Check answers before launch",
      done: data.tested,
      href: "/app/test-agent",
    },
    {
      title: "Connect a channel",
      description: "Start receiving messages",
      done: websiteReady,
      href: "/app/channels",
    },
  ];
  const completed = steps.filter((s) => s.done).length;
  const metrics = [
    {
      label: "Conversations",
      note: "Customer conversations",
      id: "customer-conversation-count",
    },
    {
      label: "Leads captured",
      note: "Contact details collected",
      id: "customer-lead-count",
    },
    {
      label: "Qualified leads",
      note: "Ready for follow-up",
      id: "customer-qualified-count",
    },
    {
      label: "Needs your attention",
      note: "Waiting for your team",
      id: "customer-needs-you-count",
    },
  ];
  return (
    <>
      <PageHeader
        title="Overview"
        description={`Customer activity in ${name}.`}
        action={
          <ActionLink href={href("/app/inbox")}>
            <Inbox aria-hidden="true" />
            Open inbox
          </ActionLink>
        }
      />
      <div className="overview-section-heading">
        <h2>Customer activity</h2>
        <span className="muted small">Test conversations excluded</span>
      </div>
      <div className="metrics-grid">
        {metrics.map((metric, i) => (
          <Panel className="metric" key={metric.id}>
            <span className="metric-label">{metric.label}</span>
            <p className="metric-value" data-testid={metric.id}>
              {data.metrics[i] == null
                ? "—"
                : data.metrics[i]?.toLocaleString()}
            </p>
            <p className="metric-footer">
              {data.metrics[i] === null
                ? "Temporarily unavailable"
                : metric.note}
            </p>
          </Panel>
        ))}
      </div>
      {completed < 4 && (
        <Panel className="setup-panel">
          <div className="setup-heading">
            <div>
              <h2>Get started</h2>
              <p>Set up your workspace to start helping customers.</p>
            </div>
            <Badge>{completed} of 4 complete</Badge>
          </div>
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
          <div className="setup-list">
            {steps.map((step, i) => (
              <Step
                {...step}
                number={i + 1}
                href={href(step.href)}
                key={step.title}
              />
            ))}
          </div>
        </Panel>
      )}
      <div className="overview-columns">
        <Panel
          title="Recent conversations"
          action={
            <Link href={href("/app/inbox")} className="text-link">
              View all
              <ArrowRight aria-hidden="true" />
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
                        <strong>{item.customerRef || "Website visitor"}</strong>
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
                      <p>{item.preview || "New conversation"}</p>
                    </div>
                    <time
                      className="conversation-date"
                      dateTime={item.updatedAt}
                    >
                      {dateLabel(item.updatedAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No conversations yet"
              description="Connect your website or Instagram. New conversations will appear here."
              action={
                <ActionLink secondary href={href("/app/channels")}>
                  Connect a channel
                  <ArrowRight aria-hidden="true" />
                </ActionLink>
              }
            />
          )}
          <div className="list-footer">
            <span>Customer conversations</span>
            <span>{data.inbox.length} recent</span>
          </div>
        </Panel>
        <div className="stack">
          <Panel
            title="Channels"
            action={
              <Link href={href("/app/channels")} className="text-link">
                Manage
              </Link>
            }
          >
            {(["website_chat", "instagram"] as const).map((channel) => {
              const connection = data.channels?.find(
                (c) => c.channel === channel,
              );
              const ready = Boolean(
                connection?.enabled &&
                  (channel === "website_chat" ||
                    (connection.status === "connected" &&
                      connection.verified_at)),
              );
              return (
                <div className="channel-row" key={channel}>
                  <ChannelIcon channel={channel} />
                  <div>
                    <strong>
                      {channel === "website_chat"
                        ? "Website Chat"
                        : "Instagram"}
                    </strong>
                    <p>
                      {channel === "website_chat"
                        ? "Website messenger"
                        : connection?.provider_username
                          ? `@${connection.provider_username}`
                          : "Direct messages"}
                    </p>
                  </div>
                  <Badge tone={ready ? "success" : "neutral"} dot>
                    {data.channels === null
                      ? "Unavailable"
                      : ready
                        ? "Connected"
                        : "Not connected"}
                  </Badge>
                </div>
              );
            })}
          </Panel>
          <Panel title="Agent knowledge">
            <div className="knowledge-summary">
              <span className="knowledge-total">{data.published ?? "—"}</span>
              <div>
                <strong>Published items</strong>
                <p>Available to your AI agent</p>
              </div>
            </div>
            <div className="list-footer">
              <Link className="text-link" href={href("/app/knowledge/new")}>
                <Plus aria-hidden="true" />
                Add knowledge
              </Link>
              <Link className="text-link" href={href("/app/test-agent")}>
                Test agent
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
