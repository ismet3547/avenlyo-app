import {
  Globe,
  MessageCircle,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WebsiteChannelForm,
  EmbedSnippet,
  DisconnectInstagram,
} from "@/components/channel-forms";
import { requireWorkspace } from "@/lib/workspace";
import { websiteOriginSchema } from "@avenlyo-app/shared";
import { dateLabel } from "@/lib/utils";
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
      : instagram && instagram.status !== "disconnected"
        ? "Managed setup required"
        : "Not configured";
  return (
    <>
      <PageHeader
        eyebrow="Customer touchpoints"
        title="Meet customers where they are"
        description="The same agent and business knowledge, wherever a conversation begins."
        action={
          <Button variant="outline" asChild>
            <Link href="/app/inbox">
              Open Inbox
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="mb-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
        <Link
          href="/app/agent"
          className="inline-flex items-center gap-2 hover:text-primary"
        >
          <Sparkles className="size-3.5" aria-hidden />
          Shared agent settings
          <ArrowUpRight className="size-3" aria-hidden />
        </Link>
        <Link
          href="/app/knowledge"
          className="inline-flex items-center gap-2 hover:text-primary"
        >
          <BookOpen className="size-3.5" aria-hidden />
          Published knowledge
          <ArrowUpRight className="size-3" aria-hidden />
        </Link>
      </div>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5">
            <div className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-xl border border-border bg-muted/50">
                <Globe
                  className="size-5 text-primary"
                  strokeWidth={1.6}
                  aria-hidden
                />
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Website Chat
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  A helpful welcome, right on your website.
                </p>
              </div>
            </div>
            <Badge className={website?.enabled ? "status-success" : ""}>
              <span className="status-dot" />
              {websiteState}
            </Badge>
          </div>
          <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
            <div>
              <p className="eyebrow">01 · Choose your websites</p>
              <p className="text-xs leading-6 text-muted-foreground">
                Enable chat on the exact websites you approve. Visitors can ask
                questions without an Avenlyo account.
              </p>
              <WebsiteChannelForm
                enabled={website?.enabled ?? false}
                origins={
                  website?.approved_origins ??
                  (local ? ["http://localhost:3001"] : [])
                }
                editable={ctx.role === "owner"}
              />
            </div>
            <div>
              <p className="eyebrow">02 · Install your chat widget</p>
              {website ? (
                <>
                  <EmbedSnippet
                    snippet={`<script async src="${publicUrl}/widget.js" data-avenlyo-channel="${website.public_id}"></script>`}
                  />
                  {local && (
                    <Link
                      href={`/chat-demo?channel=${website.public_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary"
                    >
                      Open local widget demo
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                  {website.last_activity_at && (
                    <p className="mt-5 text-[11px] text-muted-foreground">
                      Last customer activity ·{" "}
                      {dateLabel(website.last_activity_at)}
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6">
                  <Globe className="size-6 text-muted-foreground" aria-hidden />
                  <p className="mt-4 text-sm font-medium">
                    Your snippet will appear here.
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    Save your website settings first. Then copy the snippet into
                    the websites you approved.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5">
            <div className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-xl border border-border bg-muted/50">
                <MessageCircle
                  className="size-5 text-primary"
                  strokeWidth={1.6}
                  aria-hidden
                />
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Instagram
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Customer questions in your direct messages.
                </p>
              </div>
            </div>
            <Badge
              className={
                connected
                  ? "status-success"
                  : instagram?.status === "needs_attention"
                    ? "status-warning"
                    : ""
              }
            >
              <span className="status-dot" />
              {instagramState}
            </Badge>
          </div>
          <div className="grid gap-7 p-6 lg:grid-cols-2 lg:gap-12">
            <div>
              <h3 className="text-sm font-medium">
                {connected
                  ? `Connected to @${instagram?.provider_username ?? "your business"}`
                  : "We’ll help you get connected."}
              </h3>
              <p className="mt-3 max-w-lg text-xs leading-7 text-muted-foreground">
                {connected
                  ? "Supported customer-initiated direct messages use your saved agent settings and published knowledge. Your team can continue the conversation from Inbox."
                  : "Instagram uses managed setup. Your Avenlyo operator verifies the professional account, messaging access and webhook connection for this workspace."}
              </p>
              {connected && instagram?.verified_at && (
                <p className="mt-4 text-[11px] text-muted-foreground">
                  Connection verified · {dateLabel(instagram.verified_at)}
                </p>
              )}
              {instagram && instagram.status !== "disconnected" && (
                <DisconnectInstagram editable={ctx.role === "owner"} />
              )}
            </div>
            <div className="rounded-xl bg-muted/50 p-5">
              <h3 className="text-xs font-semibold">
                A clear handoff, wherever it starts.
              </h3>
              <p className="mt-2 text-xs leading-7 text-muted-foreground">
                Replies follow Instagram’s supported messaging window. Delivery
                failures and unconfirmed sends are visible in the conversation,
                so your team can decide what to do next.
              </p>
            </div>
          </div>
        </Card>
      </div>
      <p className="mt-6 max-w-3xl text-xs leading-7 text-muted-foreground">
        Qualified inquiries and requests for human help can notify a verified
        workspace owner by email. Notification status appears in the
        conversation details. Test conversations do not send notifications.
      </p>
    </>
  );
}
