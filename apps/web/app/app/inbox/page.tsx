import Link from "next/link";
import { MessageSquare, UserRound, Play, ArrowRight } from "lucide-react";
import type { InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConversationItem } from "@/components/conversation-item";
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
        description="Every customer question, with the context your team needs to continue."
        action={
          <Button asChild variant="outline">
            <Link href="/app/channels">Manage channels</Link>
          </Button>
        }
      />
      {result.error ? (
        <p role="alert">Inbox could not be loaded.</p>
      ) : !conversations?.length ? (
        <EmptyState
          title="Customer conversations will appear here."
          description="Enable Website Chat or complete managed Instagram setup. Real messages arrive here; Test Agent conversations stay in Conversations."
          action={
            <Button asChild>
              <Link href="/app/channels">Set up a channel</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
          <Card className="overflow-hidden">
            <div className="panel-heading">
              <h2 className="panel-title">Recent conversations</h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {conversations.length} shown
              </span>
            </div>
            <div className="divide-y divide-border">
              {conversations.map((item) => (
                <ConversationItem
                  key={item.id}
                  item={item}
                  actorId={ctx.user.id}
                />
              ))}
            </div>
          </Card>
          <Card className="hidden p-6 xl:block">
            <span className="grid size-10 place-items-center rounded-lg border border-border bg-success-soft">
              <MessageSquare aria-hidden className="size-5 text-primary" />
            </span>
            <h2 className="mt-5 text-lg font-medium tracking-tight">
              A conversation, with a clear next step.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Open a thread to see the customer’s question, inquiry details and
              the current AI state.
            </p>
            <div className="mt-6 space-y-5 border-t border-border pt-5">
              {[
                {
                  icon: UserRound,
                  title: "Continue personally",
                  description:
                    "Claim the conversation before sending a human reply.",
                },
                {
                  icon: Play,
                  title: "Stay in control",
                  description:
                    "AI stays paused until your team explicitly resumes it.",
                },
              ].map(({ icon: Icon, title, description }) => (
                <div className="flex gap-3" key={title}>
                  <Icon aria-hidden className="mt-1 size-4 text-primary" />
                  <div>
                    <p className="text-[13px] font-medium">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/app/conversations"
              className="mt-6 inline-flex items-center gap-2 text-xs text-primary"
            >
              Looking for a test conversation?
              <ArrowRight aria-hidden className="size-3" />
            </Link>
          </Card>
        </div>
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
