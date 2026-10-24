import { QueryError } from "@/components/query-error";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { dateLabel } from "@/lib/utils";
import { Pagination, PAGE_SIZE, pageNumber } from "@/components/pagination";
import { channelLabels } from "@avenlyo-app/shared";
export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; state?: string; page?: string }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const channel =
    params.channel && Object.hasOwn(channelLabels, params.channel)
      ? (params.channel as keyof typeof channelLabels)
      : "all";
  const state = params.state === "paused" ? "paused" : "all";
  let query = ctx.supabase
    .from("conversations")
    .select("*", { count: "exact" })
    .eq("workspace_id", ctx.workspace.id)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (channel !== "all") query = query.eq("channel", channel);
  if (state === "paused") query = query.eq("ai_mode", "paused");
  const result = await query;
  return (
    <>
      <PageHeader
        title="Conversations"
        description="A record of customer and Test Agent conversations, with their channel and human assistance state."
        action={
          <Button asChild variant="outline">
            <Link href="/app/test-agent">New test</Link>
          </Button>
        }
      />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">
          Channel
          <select
            name="channel"
            defaultValue={channel}
            className="mt-2 block h-11 rounded-lg border border-border bg-white px-3"
          >
            <option value="all">All channels</option>
            {Object.entries(channelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          AI state
          <select
            name="state"
            defaultValue={state}
            className="mt-2 block h-11 rounded-lg border border-border bg-white px-3"
          >
            <option value="all">All states</option>
            <option value="paused">AI paused</option>
          </select>
        </label>
        <Button type="submit" variant="outline">
          Apply filters
        </Button>
        {(channel !== "all" || state !== "all") && (
          <Link
            href="/app/conversations"
            className="py-3 text-sm text-primary underline"
          >
            Clear filters
          </Link>
        )}
      </form>
      {result.error ? (
        <QueryError message="Conversations could not be loaded. Try again to see saved threads." />
      ) : !result.data.length ? (
        <EmptyState
          title={
            channel !== "all" || state !== "all" || page
              ? "No conversations match"
              : "Start your first conversation"
          }
          description={
            channel !== "all" || state !== "all" || page
              ? "Choose a different channel or AI state, or return to all conversations."
              : "Test a customer question. Your conversation will be saved here with its workspace and outcome."
          }
          action={
            <Button asChild>
              <Link
                href={
                  channel !== "all" || state !== "all" || page
                    ? "/app/conversations"
                    : "/app/test-agent"
                }
              >
                {channel !== "all" || state !== "all" || page
                  ? "View all conversations"
                  : "Test agent"}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="divide-y divide-border">
          {result.data.map((c) => (
            <Link
              href={
                c.channel === "test_agent"
                  ? `/app/conversations/${c.id}`
                  : `/app/inbox/${c.id}`
              }
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 hover:bg-muted/40"
              key={c.id}
            >
              <div>
                <p className="text-sm font-medium">
                  {c.channel === "test_agent"
                    ? "Test conversation"
                    : "Customer conversation"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {c.id.slice(0, 8)}
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {channelLabels[c.channel]} · {dateLabel(c.updated_at)}
                </p>
              </div>
              <Badge
                className={
                  c.ai_mode === "paused"
                    ? "border-amber-100 bg-amber-50 text-amber-800"
                    : ""
                }
              >
                {c.ai_mode === "paused"
                  ? "Needs human · AI paused"
                  : "AI active"}
              </Badge>
            </Link>
          ))}
        </Card>
      )}
      {!result.error && (
        <Pagination
          pathname="/app/conversations"
          page={page}
          total={result.count ?? 0}
          filters={{ channel, state }}
        />
      )}
    </>
  );
}
