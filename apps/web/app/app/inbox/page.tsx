import { RefreshList } from "@/components/refresh-list";
import { QueryError } from "@/components/query-error";
import Link from "next/link";
import { Globe, MessageCircle, UserRound, ArrowRight } from "lucide-react";
import { channelLabels, type InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { dateLabel } from "@/lib/utils";
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const page = Math.max(
    0,
    Math.min(2000, Number.parseInt(params.page ?? "0") || 0),
  );
  const result = await ctx.supabase.rpc("inbox_snapshot", {
    target_workspace_id: ctx.workspace.id,
    page_offset: page * 50,
  });
  const conversations = result.data as unknown as InboxItem[] | null;
  return (
    <>
      <PageHeader
        eyebrow="Customer conversations"
        title="Inbox"
        description="Questions, useful inquiries and conversations that need your team. Claim a thread to continue it personally."
        action={
          <Button asChild variant="outline">
            <Link href="/app/channels">Manage channels</Link>
          </Button>
        }
      />
      <RefreshList />
      {result.error ? (
        <QueryError message="Inbox could not be loaded. Try again to check the latest customer conversations." />
      ) : !conversations?.length ? (
        <EmptyState
          title={
            page
              ? "No more conversations on this page"
              : "Your next conversation starts here"
          }
          description={
            page
              ? "Return to the previous page or open the latest conversations."
              : "Enable Website Chat or complete managed Instagram setup. Real customer messages will appear here; Test Agent conversations stay in Conversations."
          }
          action={
            <Button asChild>
              <Link href={page ? "/app/inbox" : "/app/channels"}>
                {page ? "Latest conversations" : "Set up a channel"}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="divide-y divide-border">
          {conversations.map((c) => {
            const Icon = c.channel === "website_chat" ? Globe : MessageCircle;
            return (
              <Link
                key={c.id}
                href={`/app/inbox/${c.id}`}
                className="group flex gap-4 p-5 hover:bg-muted/30 sm:p-6"
              >
                <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-[#efeffd] text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {c.channel === "website_chat" &&
                      c.customerRef.includes("-")
                        ? `Website visitor · ${c.customerRef.slice(0, 8)}`
                        : c.customerRef}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {dateLabel(c.updatedAt)}
                    </time>
                  </div>
                  <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted-foreground">
                    {c.preview ?? "Waiting for the first customer message."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs text-muted-foreground">
                      {channelLabels[c.channel]}
                    </span>
                    {c.aiMode === "paused" ? (
                      <Badge className="border-amber-100 bg-amber-50 text-amber-800">
                        Needs human · AI paused
                      </Badge>
                    ) : (
                      <Badge className="border-emerald-100 bg-emerald-50 text-emerald-800">
                        AI active
                      </Badge>
                    )}
                    {c.qualification && (
                      <Badge>
                        {c.qualification === "qualified"
                          ? "Qualified lead"
                          : c.qualification === "needs_human"
                            ? "Lead needs human"
                            : "Lead needs info"}
                      </Badge>
                    )}
                    {c.assigneeId && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <UserRound className="size-3" aria-hidden />
                        {c.assigneeId === ctx.user.id
                          ? "Claimed by you"
                          : "Claimed by a team member"}
                      </span>
                    )}
                    {c.needsAttention && (
                      <Badge className="border-red-100 bg-red-50 text-red-700">
                        Delivery needs attention
                      </Badge>
                    )}
                  </div>
                </div>
                <ArrowRight
                  className="mt-2 size-4 shrink-0 text-muted-foreground group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            );
          })}
        </Card>
      )}
      {(page > 0 || conversations?.length === 50) && (
        <div className="mt-5 flex gap-3">
          {page > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/inbox?page=${page - 1}`}>Previous</Link>
            </Button>
          )}
          {conversations?.length === 50 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/inbox?page=${page + 1}`}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
