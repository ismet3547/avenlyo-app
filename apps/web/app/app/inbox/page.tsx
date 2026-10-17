import Link from "next/link";
import type { InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
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
    <div className="max-w-[1120px]">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-medium tracking-[-.035em]">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real customer conversations. Your team steps in when needed.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/app/channels">Manage channels</Link>
        </Button>
      </header>
      {result.error ? (
        <p role="alert">Inbox could not be loaded.</p>
      ) : !conversations?.length ? (
        <EmptyState
          title="Customer conversations will appear here."
          description="Connect an approved website or Instagram account. Customer messages arrive here with their inquiry, contact details and current AI state."
          action={
            <Button asChild>
              <Link href="/app/channels">Set up a channel</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <h2 className="text-[13px] font-medium">
              All customer conversations
            </h2>
            <span className="text-xs text-muted-foreground">
              {conversations.length} shown · latest activity first
            </span>
          </div>
          <div className="divide-y divide-border border-b border-border">
            {conversations.map((item) => (
              <ConversationItem
                key={item.id}
                item={item}
                actorId={ctx.user.id}
              />
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Claim a conversation to reply personally. AI stays paused until your
            team explicitly resumes it.
          </p>
        </>
      )}
      {(page > 0 || conversations?.length === 50) && (
        <div className="mt-5 flex gap-3">
          {page > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href={"/app/inbox?page=" + (page - 1)}>Previous</Link>
            </Button>
          )}
          {conversations?.length === 50 && (
            <Button asChild variant="outline" size="sm">
              <Link href={"/app/inbox?page=" + (page + 1)}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
