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
          eyebrow="A NATURAL EXTENSION OF YOUR TEAM"
          title="Meet your agent."
          description="Give it a voice, a purpose and a clear way to help your customers."
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
          eyebrow="A PLACE FOR EVERY CONVERSATION"
          title="A calmer kind of inbox."
          description="Your agent handles the first hello. You’re here when a human touch matters."
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
          eyebrow="GOOD ANSWERS START HERE"
          title="What your business knows."
          description="The services, details and answers that make your agent helpful."
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
          title={item ? "A little more detail." : "Share a little knowledge."}
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
          eyebrow="TURN INTEREST INTO OPPORTUNITY"
          title="People worth a follow-up."
          description="Useful inquiries, captured details and a clear next step for your team."
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
          eyebrow="CURIOUS? START A CONVERSATION."
          title="See your agent in action."
          description="Ask, explore and fine-tune. A little practice makes a more helpful agent."
        />
        <TestAgent workspaceId={workspaceId} preview published={5} />
      </>
    );
  else if (screen === "/app/conversations")
    content = (
      <>
        <PageHeader
          title="Your test conversations."
          description="A record of the questions you’ve tried and the answers you can improve."
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
          eyebrow="BE THERE WHEN THEY SAY HELLO"
          title="Meet customers where they are."
          description="One helpful agent, connected to the places your customers already use."
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
          eyebrow="THE DETAILS THAT MAKE IT YOURS"
          title="Workspace settings."
          description="A few essentials for your business and your account."
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
        name="Forma Studio"
        preview
        data={{
          metrics: empty ? [0, 0, 0, 0] : [128, 24, 18, 3],
          channels: empty ? [] : channels,
          published: empty ? 0 : 5,
          configured: !empty,
          tested: false,
          inbox: empty ? [] : items,
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
