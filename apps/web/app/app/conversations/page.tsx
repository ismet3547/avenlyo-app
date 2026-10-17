import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { dateLabel } from "@/lib/utils";
export default async function ConversationsPage() {
  const ctx = await requireWorkspace();
  const result = await ctx.supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("channel", "test_agent")
    .order("updated_at", { ascending: false })
    .limit(100);
  return (
    <div className="page-reading">
      <Link
        href="/app/agent"
        className="mb-6 inline-block text-xs text-muted-foreground hover:text-primary"
      >
        ← Agent
      </Link>
      <PageHeader
        eyebrow="Test mode"
        title="Test conversations"
        description="Saved Test Agent sessions. No external customer messages are sent from these conversations."
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
          description="Try a customer question, then review the answer, lead and handoff outcome. Real customer conversations stay in Inbox."
          action={
            <Button asChild>
              <Link href="/app/test-agent">Test agent</Link>
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {result.data.map((c) => (
            <Link
              key={c.id}
              href={`/app/conversations/${c.id}`}
              className="flex flex-wrap items-center justify-between gap-4 py-5 hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium">
                  Test conversation{" "}
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                    {c.id.slice(0, 8)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Test Agent · {dateLabel(c.updated_at)}
                </p>
              </div>
              <span
                className="status-text"
                data-tone={c.ai_mode === "paused" ? "attention" : undefined}
              >
                {c.ai_mode === "paused" ? "Needs human · AI paused" : "Open"}
              </span>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-6 text-[13px] text-muted-foreground">
        Looking for a real customer?{" "}
        <Link
          href="/app/inbox"
          className="font-medium text-primary hover:underline"
        >
          Open Inbox →
        </Link>
      </p>
    </div>
  );
}
