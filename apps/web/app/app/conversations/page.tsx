import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { dateLabel } from "@/lib/utils";
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
        title="Conversations"
        description="A clear record of your agent’s test conversations and when human assistance was requested."
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
          title="Start your first conversation"
          description="Test a customer question. Your conversation will be saved here with its workspace and outcome."
          action={
            <Button asChild>
              <Link href="/app/test-agent">Test agent</Link>
            </Button>
          }
        />
      ) : (
        <Card className="divide-y divide-border">
          {result.data.map((c) => (
            <Link
              href={`/app/conversations/${c.id}`}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 hover:bg-muted/40"
              key={c.id}
            >
              <div>
                <p className="text-sm font-medium">
                  Test conversation{" "}
                  <span className="font-normal text-muted-foreground">
                    · {c.id.slice(0, 8)}
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Test Agent · {dateLabel(c.updated_at)}
                </p>
              </div>
              <Badge
                className={
                  c.status === "needs_human"
                    ? "border-amber-100 bg-amber-50 text-amber-800"
                    : ""
                }
              >
                {c.status === "needs_human"
                  ? "Needs human · AI paused"
                  : "Open"}
              </Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
