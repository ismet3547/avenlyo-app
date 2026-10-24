import { Globe, MessageCircle, ArrowUpRight } from "lucide-react";
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
  const demoOrigin = new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  ).origin;
  const canDemo = Boolean(
    website?.enabled && website.approved_origins.includes(demoOrigin),
  );
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
    <>
      <PageHeader
        title="Meet customers where they are"
        description="Your agent settings and published knowledge power every channel. Real customer conversations come together in Inbox."
      />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Card className="min-w-0 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-xl border border-border bg-muted">
              <Globe className="size-5" aria-hidden />
            </span>
            <Badge
              className={
                website?.enabled
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : ""
              }
            >
              {websiteState}
            </Badge>
          </div>
          <h2 className="mt-5 text-lg font-semibold tracking-tight">
            Website Chat
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A small chat widget for customer questions, useful inquiries and a
            clear handoff to your team.
          </p>
          <WebsiteChannelForm
            workspaceId={ctx.workspace.id}
            enabled={website?.enabled ?? false}
            origins={
              website?.approved_origins ??
              (local ? ["http://localhost:3001"] : [])
            }
            editable={ctx.role === "owner"}
          />
          {website && (
            <EmbedSnippet
              snippet={`<script async src="${publicUrl}/widget.js" data-avenlyo-channel="${website.public_id}"></script>`}
            />
          )}
          {website && local && canDemo && (
            <Link
              href={`/chat-demo?channel=${website.public_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary"
            >
              Open local widget demo
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          )}
          {website && local && (
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              {canDemo
                ? "The local demo creates a real Website Chat thread in Inbox. Use Test Agent for isolated tests."
                : `To use the local demo, enable Website Chat and save ${demoOrigin} as an approved origin.`}
            </p>
          )}
          {website?.enabled && (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Next: install the snippet on an approved website, then check
              incoming conversations in{" "}
              <Link href="/app/inbox" className="text-primary underline">
                Inbox
              </Link>
              .
            </p>
          )}
        </Card>
        <Card className="min-w-0 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-xl border border-border bg-muted">
              <MessageCircle className="size-5" aria-hidden />
            </span>
            <Badge
              className={
                connected
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : ""
              }
            >
              {instagramState}
            </Badge>
          </div>
          <h2 className="mt-5 text-lg font-semibold tracking-tight">
            Instagram
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Reply to supported customer-initiated direct messages through the
            same agent, with human replies from Inbox.
          </p>
          {instagram?.status === "needs_attention" && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
            >
              This connection needs operator attention. Ask your Avenlyo
              operator to review messaging permissions and reconnect the
              verified account for {ctx.workspace.name}. Check failed deliveries
              in Inbox.
            </p>
          )}
          {ctx.role !== "owner" && (
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              You have member access. Channel changes require a workspace owner.
            </p>
          )}
          {connected ? (
            <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-sm font-semibold">
                @{instagram?.provider_username}
              </p>
              <p className="mt-2 break-all text-xs text-muted-foreground">
                Professional account · {instagram?.provider_account_id}
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium">Founder-assisted setup</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                A verified professional account, messaging access and webhook
                setup are required. Ask your Avenlyo operator to connect the
                correct account for this workspace.
              </p>
            </div>
          )}
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Replies follow Instagram’s supported messaging window. Delivery
            failures and unconfirmed sends are visible in Inbox.
          </p>
          {instagram && instagram.status !== "disconnected" && (
            <DisconnectInstagram
              workspaceId={ctx.workspace.id}
              editable={ctx.role === "owner"}
            />
          )}
        </Card>
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-white p-5">
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          When a real inquiry qualifies or needs a person, a staff email is
          recorded for a verified workspace owner. Delivery status appears with
          the conversation.
        </p>
        <Button asChild variant="outline">
          <Link href="/app/inbox">Open Inbox</Link>
        </Button>
      </div>
    </>
  );
}
