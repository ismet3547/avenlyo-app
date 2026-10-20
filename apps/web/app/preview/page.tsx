import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Eye, Plus } from "lucide-react";
import { defaultSettings } from "@avenlyo-app/shared";
import { AppShell } from "@/components/app-shell";
import { AgentForm } from "@/components/product-forms";
import { InboxView, TestAgent } from "@/components/conversations";
import { KnowledgeLibrary } from "@/components/knowledge-library";
import { LeadsList } from "@/components/leads-list";
import { Overview } from "@/components/overview";
import {
  ActionLink,
  Badge,
  ChannelIcon,
  PageHeader,
  Panel,
} from "@/components/ui";
import {
  channels,
  collections,
  items,
  knowledge,
  leads,
  threadFor,
  workspaceId,
} from "./fixtures";
import { screenHref } from "@/lib/presentation";
export const dynamic = "force-dynamic";
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string; empty?: string }>;
}) {
  // Fixtures are available only in local development; this route never reads user data.
  if (process.env.NODE_ENV !== "development") notFound();
  const { screen = "/app", empty } = await searchParams;
  const href = (path: string) => screenHref(path, true);
  let content;
  if (screen.startsWith("/app/agent"))
    content = (
      <>
        <PageHeader
          title="Agent settings"
          description="Configure your agent’s behavior, tone and instructions."
          action={
            <ActionLink secondary href={href("/app/test-agent")}>
              Test your agent
              <ArrowRight aria-hidden="true" />
            </ActionLink>
          }
        />
        <AgentForm
          settings={{
            ...defaultSettings,
            tone: "warm",
            setup_brief:
              "You are the welcoming first point of contact for Forma Studio. Help customers explore our design services, understand their goals and connect them with our team.",
          }}
          editable={false}
          published={5}
          preview
        />
      </>
    );
  else if (screen.startsWith("/app/inbox")) {
    const id = screen.split("/")[3];
    content = (
      <>
        <PageHeader
          title="Inbox"
          description="Manage customer conversations and reply with your team."
        />
        <div className="stack">
          <InboxView
            key={id || "list"}
            items={empty ? [] : items}
            initialThread={id ? threadFor(id) : undefined}
            userId="preview-user"
            preview
            contact={
              id ? leads.find((l) => l.conversation_id === id) : undefined
            }
          />
        </div>
      </>
    );
  } else if (screen === "/app/knowledge")
    content = (
      <>
        <PageHeader
          title="Content"
          description="Manage the content your AI agent uses to answer customers."
          action={
            <ActionLink href={href("/app/knowledge/new")}>
              <Plus aria-hidden="true" />
              Add knowledge
            </ActionLink>
          }
        />
        <KnowledgeLibrary
          items={empty ? [] : knowledge}
          collections={collections}
          editable={false}
          preview
        />
      </>
    );
  else if (screen.startsWith("/app/knowledge/")) {
    const item = knowledge.find((k) => screen.endsWith(k.id));
    content = (
      <>
        <Link
          className="text-link"
          href={href("/app/knowledge")}
          style={{ marginBottom: 22 }}
        >
          <ArrowLeft aria-hidden="true" />
          Back to knowledge
        </Link>
        <PageHeader
          title={item ? "Edit knowledge" : "Add knowledge"}
          description="One clear piece of information. Better answers for your customers."
        />
        <Panel title={item?.title || "Create a knowledge item"}>
          <div className="form-section stack">
            <label className="field">
              <span className="field-label">Title</span>
              <input
                className="input"
                disabled
                defaultValue={item?.title}
                placeholder="Give this item a clear, descriptive title"
              />
            </label>
            <label className="field">
              <span className="field-label">Content</span>
              <textarea
                className="textarea"
                rows={8}
                disabled
                defaultValue={item?.content}
                placeholder="Add the information your customers need…"
              />
            </label>
            <Badge tone="accent">Read-only design preview</Badge>
          </div>
        </Panel>
      </>
    );
  } else if (screen === "/app/leads")
    content = (
      <>
        <PageHeader
          title="Leads"
          description="Customer inquiries and contact details captured by your agent."
        />
        <LeadsList leads={empty ? [] : leads} preview />
      </>
    );
  else if (screen.startsWith("/app/leads/")) {
    const lead = leads.find((l) => screen.endsWith(l.id)) || leads[0];
    content = (
      <>
        <PageHeader
          title={lead.name!}
          description={lead.company!}
          action={
            <ActionLink href={href(`/app/inbox/${lead.conversation_id}`)}>
              Open conversation
              <ArrowRight aria-hidden="true" />
            </ActionLink>
          }
        />
        <div className="detail-grid">
          <Panel title="What they’re looking for">
            <p className="detail-content">{lead.summary}</p>
          </Panel>
          <Panel title="Customer details">
            <dl className="detail-dl">
              {[
                ["Name", lead.name],
                ["Email", lead.email],
                ["Company", lead.company],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </>
    );
  } else if (screen === "/app/test-agent")
    content = (
      <>
        <PageHeader
          title="Test agent"
          description="Test answers using your published knowledge."
        />
        <TestAgent workspaceId={workspaceId} preview published={5} />
      </>
    );
  else if (screen === "/app/conversations")
    content = (
      <>
        <PageHeader
          title="Test history"
          description="Review previous test sessions and continue a conversation."
        />
        <Panel>
          <div className="conversation-row">
            <Badge tone="accent">Test mode</Badge>
            <strong>Discovery call questions</strong>
            <Link
              className="text-link push-right"
              href={href("/app/test-agent")}
            >
              Try another question
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </Panel>
      </>
    );
  else if (screen === "/app/channels")
    content = (
      <>
        <PageHeader
          title="Channels"
          description="Connect your website and Instagram to receive conversations."
        />
        <div className="channel-cards">
          {channels.map((c) => (
            <Panel key={c.id}>
              <div className="channel-card-heading">
                <ChannelIcon channel={c.channel} />
                <div>
                  <h2>
                    {c.channel === "website_chat"
                      ? "Website Chat"
                      : "Instagram"}
                  </h2>
                  <p>
                    {c.channel === "website_chat"
                      ? "A friendly welcome, right on your website."
                      : "Thoughtful answers, in their DMs."}
                  </p>
                </div>
                <Badge dot tone={c.enabled ? "success" : "neutral"}>
                  {c.enabled ? "Active" : "Not connected"}
                </Badge>
              </div>
              <p className="channel-description">
                {c.channel === "website_chat"
                  ? "Answer questions while interest is fresh. Your agent helps visitors find what they need, then brings your team in when it matters."
                  : "Bring Instagram conversations into the same inbox. Help customers with your business knowledge and hand off to a person when needed."}
              </p>
              {c.channel === "website_chat" ? (
                <details className="disclosure">
                  <summary>
                    Configure Website Chat
                    <ChevronDown aria-hidden="true" />
                  </summary>
                  <div className="form-section stack">
                    <label className="field">
                      <span className="field-label">Approved websites</span>
                      <textarea
                        className="textarea"
                        disabled
                        defaultValue="https://example.com"
                      />
                    </label>
                    <Badge tone="accent">Read-only design preview</Badge>
                  </div>
                </details>
              ) : (
                <div className="panel-body">
                  <p className="notice">
                    Ask your workspace administrator to arrange an Instagram
                    connection. Once verified, its status will appear here.
                  </p>
                </div>
              )}
            </Panel>
          ))}
        </div>
      </>
    );
  else if (screen === "/app/settings")
    content = (
      <>
        <PageHeader
          title="Settings"
          description="Manage your business profile and account."
        />
        <Panel title="Your business">
          <div className="form-section">
            <label className="field">
              <span className="field-label">Business name</span>
              <input className="input" disabled defaultValue="Forma Studio" />
            </label>
          </div>
        </Panel>
      </>
    );
  else
    content = (
      <Overview
        preview
        data={{
          channels,
          firstChannelActivatedAt: channels.some((channel) => channel.enabled)
            ? "2026-10-20T10:00:00Z"
            : null,
          attentionCount: empty
            ? 0
            : items.filter((i) => i.aiMode === "paused").length,
          attention: empty
            ? []
            : items
                .filter((i) => i.aiMode === "paused")
                .slice(0, 3)
                .map((i) => ({
                  id: i.id,
                  name: i.customerRef,
                  channel: i.channel,
                  preview: i.preview,
                  at: i.updatedAt,
                  activity: "Conversation handed to your team",
                })),
          recent: empty
            ? []
            : items.slice(0, 5).map((i) => ({
                id: i.id,
                name: i.customerRef,
                channel: i.channel,
                preview: i.preview,
                at: i.updatedAt,
                activity: "Customer asked",
              })),
        }}
      />
    );
  return (
    <AppShell
      workspace={{ id: workspaceId, name: "Forma Studio" }}
      workspaces={[{ id: workspaceId, name: "Forma Studio" }]}
      email="alex@example.com"
      role="owner"
      preview
      activePath={screen}
    >
      <div className="preview-banner">
        <Eye aria-hidden="true" />
        <span>
          Design preview · fictional sample data · changes and sending are
          disabled
        </span>
        <Link
          href={`/preview?screen=${encodeURIComponent(screen)}${empty ? "" : "&empty=1"}`}
        >
          {empty ? "Show sample data" : "Show empty state"}
        </Link>
      </div>
      {content}
    </AppShell>
  );
}
