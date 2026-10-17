import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { dateLabel } from "@/lib/utils";
import { channelLabels } from "@avenlyo-app/shared";
export default async function ConversationsPage() {
  const ctx = await requireWorkspace();
  const result = await ctx.supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("updated_at", { ascending: false })
    .limit(100);
  return (
    <>
      <PageHeader
        eyebrow="Conversation history"
        title="Conversations"
        description="Review Test Agent sessions separately from real customer conversations in Inbox."
        action={
          <Button asChild variant="outline">
            <Link href="/app/test-agent">New test</Link>
          </Button>
        }
      />
      {result.error ? (
        <p role="alert">Conversations could not be loaded.</p>
      ) : !result.data.length ? (
        <EmptyState
          title="Start your first test conversation"
          description="Try a customer question and review the answer, lead and handoff outcome. Test sessions stay clearly labeled here."
          action={
            <Button asChild>
              <Link href="/app/test-agent">Test agent</Link>
            </Button>
          }
        />
      ) : (
        <div className="page-reading space-y-6">
          {["test_agent", "customer"].map((group) => {
            const items = result.data.filter((c) =>
              group === "test_agent"
                ? c.channel === "test_agent"
                : c.channel !== "test_agent",
            );
            if (!items.length) return null;
            return (
              <section key={group}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="panel-title">
                    {group === "test_agent"
                      ? "Test Agent sessions"
                      : "Customer conversations"}
                  </h2>
                  {group === "customer" ? (
                    <Link href="/app/inbox" className="text-xs text-primary">
                      Open Inbox →
                    </Link>
                  ) : (
                    <Badge tone="test">Internal tests</Badge>
                  )}
                </div>
                <Card className="divide-y divide-border overflow-hidden">
                  {items.map((c) => (
                    <Link
                      href={
                        c.channel === "test_agent"
                          ? `/app/conversations/${c.id}`
                          : `/app/inbox/${c.id}`
                      }
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted/50"
                      key={c.id}
                    >
                      <div>
                        <p className="text-[13px] font-medium">
                          {c.channel === "test_agent"
                            ? "Test conversation"
                            : "Customer conversation"}
                          <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">
                            {c.id.slice(0, 8)}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {channelLabels[c.channel]} · {dateLabel(c.updated_at)}
                        </p>
                      </div>
                      <Badge
                        tone={
                          c.status === "needs_human" ? "attention" : "neutral"
                        }
                      >
                        {c.status === "needs_human"
                          ? "Needs human · AI paused"
                          : "Open"}
                      </Badge>
                    </Link>
                  ))}
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
