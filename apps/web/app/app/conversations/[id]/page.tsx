import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dateLabel } from "@/lib/utils";
export default async function ConversationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireWorkspace();
  const { id } = await params;
  const conversation = await ctx.supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .single();
  if (conversation.error) notFound();
  if (conversation.data.channel !== "test_agent") redirect(`/app/inbox/${id}`);
  const [messages, lead] = await Promise.all([
    ctx.supabase
      .from("messages")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("conversation_id", id)
      .order("created_at")
      .limit(100),
    ctx.supabase
      .from("leads")
      .select("id,name,qualification")
      .eq("workspace_id", ctx.workspace.id)
      .eq("conversation_id", id)
      .maybeSingle(),
  ]);
  return (
    <>
      <Link
        href="/app/conversations"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-primary"
      >
        ← All conversations
      </Link>
      <PageHeader
        title="Test conversation"
        description={`Started ${dateLabel(conversation.data.created_at)} · Test Agent`}
        action={
          <Button asChild variant="outline">
            <Link href={`/app/test-agent?conversation=${id}`}>
              Continue test
            </Link>
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <Badge>Test mode</Badge>
        <Badge>
          {conversation.data.ai_mode === "paused"
            ? "Needs human · AI paused"
            : "AI active"}
        </Badge>
        {lead.data && (
          <Link
            href={`/app/leads/${lead.data.id}`}
            className="text-xs font-medium text-primary"
          >
            View linked lead →
          </Link>
        )}
      </div>
      <Card className="max-w-4xl divide-y divide-border">
        {messages.error ? (
          <p role="alert" className="p-6">
            Messages could not be loaded.
          </p>
        ) : (
          messages.data.map((m) => (
            <article key={m.id} className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`text-xs font-semibold ${m.role === "assistant" ? "text-primary" : ""}`}
                >
                  {m.role === "assistant" ? "Avenlyo" : "Test customer"}
                </span>
                <time
                  className="text-[11px] text-muted-foreground"
                  dateTime={m.created_at}
                >
                  {dateLabel(m.created_at)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                {m.content}
              </p>
              {Array.isArray(m.sources) && m.sources.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Published knowledge:{" "}
                  {m.sources
                    .map((s) =>
                      typeof s === "object" && s !== null && "title" in s
                        ? String(s.title)
                        : "",
                    )
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </article>
          ))
        )}
      </Card>
    </>
  );
}
