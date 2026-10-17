import { Globe, MessageCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  WebsiteChannelForm,
  EmbedSnippet,
  DisconnectInstagram,
  ConnectionManagement,
} from "@/components/channel-forms";
import { requireWorkspace } from "@/lib/workspace";
import { websiteOriginSchema } from "@avenlyo-app/shared";
export default async function ChannelsPage() {
  const ctx = await requireWorkspace();
  const connections = await ctx.supabase
    .from("channel_connections")
    .select("*")
    .eq("workspace_id", ctx.workspace.id);
  if (connections.error) throw new Error("Channels could not be loaded");
  const website = connections.data.find((c) => c.channel === "website_chat");
  const instagram = connections.data.find((c) => c.channel === "instagram");
  const publicUrl = websiteOriginSchema.parse(
    process.env.AVENLYO_PUBLIC_API_URL ?? "http://localhost:4001",
  );
  const local = new URL(publicUrl).protocol === "http:";
  const connected =
    instagram?.enabled &&
    instagram.status === "connected" &&
    Boolean(instagram.verified_at);
  const websiteState = !website?.enabled
    ? "Disabled"
    : website.last_activity_at
      ? "Active"
      : "Ready";
  const instagramState = connected
    ? "Connected"
    : instagram?.status === "needs_attention"
      ? "Needs attention"
      : instagram?.status === "disconnected"
        ? "Disconnected"
        : instagram
          ? "Managed setup required"
          : "Not configured";
  return (
    <div className="max-w-[1120px]">
      <PageHeader
        title="Channels"
        description="Connect the places where customers contact your business. One agent, with your team in control."
      />
      <div className="border-t border-border">
        <section
          className="connection-row"
          aria-labelledby="website-channel-heading"
        >
          <div className="flex items-start gap-4">
            <Globe aria-hidden className="mt-1 size-5 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="website-channel-heading"
                  className="text-base font-semibold"
                >
                  Website Chat
                </h2>
                <span
                  className="status-text"
                  data-tone={website?.enabled ? "success" : undefined}
                >
                  {websiteState}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Handle inquiries directly on your website, with a clear handoff
                to your team.
              </p>
              <div className="mt-5">
                <h3 className="text-xs font-semibold">Approved sites</h3>
                {website?.approved_origins.length ? (
                  <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
                    {website.approved_origins.map((origin) => (
                      <li key={origin} className="break-all">
                        {origin}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    Approve your website’s origin to get started.
                  </p>
                )}
              </div>
              <ConnectionManagement
                label="Manage Website Chat"
                initialOpen={!website?.enabled}
              >
                <WebsiteChannelForm
                  enabled={website?.enabled ?? false}
                  origins={
                    website?.approved_origins ??
                    (local ? ["http://localhost:3001"] : [])
                  }
                  editable={ctx.role === "owner"}
                />
                {website && (
                  <EmbedSnippet
                    snippet={
                      '<script async src="' +
                      publicUrl +
                      '/widget.js" data-avenlyo-channel="' +
                      website.public_id +
                      '"></script>'
                    }
                  />
                )}
                {website && local && (
                  <Link
                    href={"/chat-demo?channel=" + website.public_id}
                    target="_blank"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary"
                  >
                    Open local widget demo
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                )}
              </ConnectionManagement>
            </div>
          </div>
        </section>
        <section
          className="connection-row"
          aria-labelledby="instagram-channel-heading"
        >
          <div className="flex items-start gap-4">
            <MessageCircle aria-hidden className="mt-1 size-5 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="instagram-channel-heading"
                  className="text-base font-semibold"
                >
                  Instagram
                </h2>
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
                  {instagramState}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Use the same Avenlyo agent for customer-initiated Instagram
                messages.
              </p>
              <div className="mt-5">
                <h3 className="text-xs font-semibold">
                  {connected ? "Professional account" : "Managed setup"}
                </h3>
                {connected ? (
                  <p className="mt-2 text-[13px]">
                    {instagram?.provider_username
                      ? "@" + instagram.provider_username
                      : "Connected professional account"}
                  </p>
                ) : (
                  <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted-foreground">
                    A verified professional account, messaging access and
                    webhook setup are required. Your Avenlyo operator connects
                    the correct account for this workspace.
                  </p>
                )}
              </div>
              {instagram && (
                <ConnectionManagement label="Connection details">
                  {connected && (
                    <p className="break-all text-[13px]">
                      Professional account · {instagram.provider_account_id}
                    </p>
                  )}
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Replies follow Instagram’s supported messaging window.
                    Delivery failures and unconfirmed sends are visible in
                    Inbox.
                  </p>
                  {instagram.status !== "disconnected" && (
                    <DisconnectInstagram editable={ctx.role === "owner"} />
                  )}
                </ConnectionManagement>
              )}
            </div>
          </div>
        </section>
      </div>
      <Link
        href="/app/inbox"
        className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-primary"
      >
        Open Inbox
        <ArrowUpRight aria-hidden className="size-3.5" />
      </Link>
    </div>
  );
}
