import { ChevronDown, Code2, ShieldCheck } from "lucide-react";
import { websiteOriginSchema } from "@avenlyo-app/shared";
import { productContext } from "@/lib/product-data";
import { Badge, ChannelIcon, PageHeader, Panel } from "@/components/ui";
import {
  DisconnectInstagram,
  EmbedSnippet,
  WebsiteConfiguration,
} from "@/components/product-forms";
export default async function Page() {
  const ctx = await productContext();
  const result = await ctx.supabase
    .from("channel_connections")
    .select("*")
    .eq("workspace_id", ctx.workspace.id);
  if (result.error) throw new Error("Channels could not be loaded.");
  const website = result.data.find((c) => c.channel === "website_chat"),
    instagram = result.data.find((c) => c.channel === "instagram"),
    editable = ctx.role === "owner";
  const connected = Boolean(
    instagram?.enabled &&
      instagram.status === "connected" &&
      instagram.verified_at,
  );
  const publicUrl = websiteOriginSchema.parse(
    process.env.AVENLYO_PUBLIC_API_URL ?? "http://localhost:4001",
  );
  const snippet = website
    ? `<script src="${publicUrl}/widget.js" data-avenlyo-channel="${website.public_id}" defer></script>`
    : "";
  return (
    <>
      <PageHeader
        eyebrow="BE THERE WHEN THEY SAY HELLO"
        title="Meet customers where they are."
        description="One helpful agent, connected to the places your customers already use."
      />
      <div className="channel-cards">
        <Panel>
          <div className="channel-card-heading">
            <ChannelIcon channel="website_chat" />
            <div>
              <h2>Website Chat</h2>
              <p>A friendly welcome, right on your website.</p>
            </div>
            <Badge tone={website?.enabled ? "success" : "neutral"} dot>
              {website?.enabled
                ? website.last_activity_at
                  ? "Active"
                  : "Ready"
                : "Not connected"}
            </Badge>
          </div>
          <p className="channel-description">
            Answer questions while interest is fresh. Your agent helps visitors
            find what they need, then brings your team in when it matters.
          </p>
          {website?.approved_origins.length ? (
            <dl className="channel-facts">
              <div>
                <dt>Approved websites</dt>
                <dd>
                  {website.approved_origins.map((origin) => (
                    <p key={origin}>{origin}</p>
                  ))}
                </dd>
              </div>
            </dl>
          ) : null}
          <WebsiteConfiguration channel={website} editable={editable} />
          {website && (
            <details className="disclosure">
              <summary>
                <span className="row">
                  <Code2 aria-hidden="true" />
                  Install on your website
                </span>
                <ChevronDown aria-hidden="true" />
              </summary>
              <div className="panel-body">
                <p className="muted small" style={{ marginBottom: 15 }}>
                  Add this snippet before your website’s closing body tag. Your
                  channel must be enabled for visitors to use it.
                </p>
                <EmbedSnippet code={snippet} />
              </div>
            </details>
          )}
        </Panel>
        <Panel>
          <div className="channel-card-heading">
            <ChannelIcon channel="instagram" />
            <div>
              <h2>Instagram</h2>
              <p>Thoughtful answers, in their DMs.</p>
            </div>
            <Badge
              tone={
                connected
                  ? "success"
                  : instagram?.status === "needs_attention"
                    ? "warning"
                    : "neutral"
              }
              dot
            >
              {connected
                ? "Connected"
                : instagram?.status === "needs_attention"
                  ? "Needs attention"
                  : "Not connected"}
            </Badge>
          </div>
          <p className="channel-description">
            Bring Instagram conversations into the same inbox. Help customers
            with your business knowledge and hand off to a person when needed.
          </p>
          <dl className="channel-facts">
            <div>
              <dt>Account</dt>
              <dd>
                {instagram?.provider_username
                  ? `@${instagram.provider_username}`
                  : "No account connected"}
              </dd>
            </div>
            <div>
              <dt>Setup</dt>
              <dd>Managed connection</dd>
            </div>
          </dl>
          <div
            className="panel-body"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {connected ? (
              <DisconnectInstagram editable={editable} />
            ) : (
              <div className="notice">
                {instagram?.status === "needs_attention"
                  ? "This connection needs a review. Ask your workspace administrator to verify the Instagram account."
                  : "Ask your workspace administrator to arrange an Instagram connection. Once verified, its status will appear here."}
              </div>
            )}
          </div>
        </Panel>
      </div>
      <div className="panel-body">
        <p className="section-note">
          <ShieldCheck aria-hidden="true" />
          Your team can take over any conversation from the Inbox.
        </p>
      </div>
    </>
  );
}
