import Link from "next/link";
import {
  Plus,
  ChevronRight,
  FileText,
  HelpCircle,
  Pencil,
  BookOpen,
} from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { KnowledgeActions } from "@/components/knowledge-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { dateLabel } from "@/lib/utils";
export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const status = ["draft", "published", "archived"].includes(
    params.status ?? "",
  )
    ? params.status
    : "all";
  let query = ctx.supabase
    .from("knowledge_items")
    .select("id,type,title,content,status,updated_at")
    .eq("workspace_id", ctx.workspace.id)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (status !== "all")
    query = query.eq("status", status as "draft" | "published" | "archived");
  const result = await query;
  const action =
    ctx.role === "owner" ? (
      <Button asChild>
        <Link href="/app/knowledge/new">
          <Plus aria-hidden />
          Add knowledge
        </Link>
      </Button>
    ) : null;
  return (
    <>
      <PageHeader
        eyebrow="Build your agent"
        title="A home for your business knowledge"
        description="The services, details and answers your agent can draw on. You decide what gets published."
        action={action}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-white px-5 py-4">
        <p className="flex max-w-xl items-start gap-3 text-xs leading-6 text-muted-foreground">
          <BookOpen className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong className="font-medium text-foreground">
              Write. Review. Publish.
            </strong>{" "}
            Saving keeps an item in Draft. Only published knowledge is available
            in answers.
          </span>
        </p>
        <Link
          href="/app/test-agent"
          className="text-xs font-medium text-primary"
        >
          Try a published answer →
        </Link>
      </div>
      <nav className="filter-bar" aria-label="Knowledge status filters">
        {["all", "published", "draft", "archived"].map((s) => (
          <Link
            key={s}
            aria-current={status === s ? "page" : undefined}
            className="filter-tab capitalize"
            href={`/app/knowledge${s === "all" ? "" : `?status=${s}`}`}
          >
            {s === "all" ? "All knowledge" : s}
          </Link>
        ))}
      </nav>
      {params.notice === "draft-saved" && (
        <p role="status" className="form-message status-success mb-5">
          Draft saved. Review the content, then publish it for your agent.
        </p>
      )}
      {result.error ? (
        <p role="alert" className="form-message bg-red-50 text-red-700">
          Knowledge could not be loaded. Try refreshing this page.
        </p>
      ) : !result.data.length ? (
        <EmptyState
          title={
            status === "all"
              ? "What should your agent know?"
              : `No ${status} items`
          }
          description="Start with your services, a common question, or the details customers ask your team every day."
          action={action}
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {result.data.length} item{result.data.length === 1 ? "" : "s"}
              {result.data.length === 100
                ? " · showing the 100 most recently updated"
                : ""}
            </span>
            <span className="hidden sm:inline">
              Most recently updated first
            </span>
          </div>
          <Card>
            {result.data.map((item) => (
              <article className="library-row" key={item.id}>
                <details>
                  <summary>
                    <span className="library-icon">
                      {item.type === "faq" ? (
                        <HelpCircle className="size-4" aria-hidden />
                      ) : (
                        <FileText className="size-4" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold leading-6">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {item.type === "faq" ? "FAQ" : "Text"} · Updated{" "}
                        {dateLabel(item.updated_at)}
                      </span>
                    </span>
                    <Badge
                      className={
                        item.status === "published"
                          ? "status-success"
                          : item.status === "draft"
                            ? "status-warning"
                            : ""
                      }
                    >
                      {item.status === "published"
                        ? "Published"
                        : item.status === "draft"
                          ? "Draft"
                          : "Archived"}
                    </Badge>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </summary>
                  <div className="library-preview">
                    <p className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                      {item.content}
                    </p>
                  </div>
                </details>
                {ctx.role === "owner" && (
                  <div className="mt-4 flex flex-wrap items-start justify-between gap-3 sm:pl-[53px]">
                    <Link
                      href={`/app/knowledge/${item.id}`}
                      className="inline-flex h-9 items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="size-3" aria-hidden />
                      Edit item
                    </Link>
                    <KnowledgeActions id={item.id} status={item.status} />
                  </div>
                )}
              </article>
            ))}
          </Card>
        </>
      )}
      <p className="mt-6 text-xs leading-6 text-muted-foreground">
        Clear, specific information makes a better starting point. Keep prices,
        availability and service limits up to date.
      </p>
    </>
  );
}
