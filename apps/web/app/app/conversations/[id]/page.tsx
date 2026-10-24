import { z } from "zod";
import { Pagination, pageNumber } from "@/components/pagination";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireWorkspace();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const page = pageNumber((await searchParams).page);
  const conversation = await ctx.supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .single();
  if (conversation.error?.code === "PGRST116") notFound();
  if (conversation.error) throw new Error("Conversation could not be loaded");
  if (conversation.data.channel !== "test_agent") redirect(`/app/inbox/${id}`);
  const [messages, lead] = await Promise.all([
    ctx.supabase
      .from("messages")
      .select("*", { count: "exact" })
      .eq("workspace_id", ctx.workspace.id)
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(page * 100, (page + 1) * 100 - 1),
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
      <p className="mb-3 text-xs leading-5 text-muted-foreground">
        {page
          ? "Earlier saved messages. Return to the previous page for more recent context."
          : "Latest saved messages. Each page reads in conversation order."}
      </p>
      <Card className="max-w-4xl divide-y divide-border">
        {messages.error ? (
          <p role="alert" className="p-6">
            Messages could not be loaded.
          </p>
        ) : (
          [...messages.data].reverse().map((m) => (
            <article key={m.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`text-xs font-semibold ${m.role === "assistant" ? "text-primary" : ""}`}
                >
                  {m.role === "assistant" ? "Avenlyo" : "Test customer"}
                </span>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={m.created_at}
                >
                  {dateLabel(m.created_at)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
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
      {!messages.error && (
        <Pagination
          pathname={`/app/conversations/${id}`}
          page={page}
          pageSize={100}
          total={messages.count ?? 0}
        />
      )}
      {lead.error && (
        <p role="alert" className="mt-4 text-sm text-red-800">
          The linked lead could not be loaded. Refresh to try again.
        </p>
      )}
    </>
  );
}
