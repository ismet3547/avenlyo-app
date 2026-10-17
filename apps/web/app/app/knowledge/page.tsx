import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  FileText,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { dateLabel } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { KnowledgeActions } from "@/components/knowledge-actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
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
  const [result, ...counts] = await Promise.all([
    query,
    ...(["published", "draft", "archived"] as const).map((s) =>
      ctx.supabase
        .from("knowledge_items")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", ctx.workspace.id)
        .eq("status", s),
    ),
  ]);
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
    <div className="max-w-[1200px]">
      <PageHeader
        title="Business knowledge"
        description="Everything Avenlyo is allowed to use when answering customers. Only published knowledge is available to your agent."
        action={action}
      />
      <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        {["published", "draft", "archived"].map((label, i) => (
          <span key={label}>
            <strong className="font-medium text-foreground">
              {counts[i].error ? "—" : (counts[i].count ?? 0)}
            </strong>{" "}
            {label}
          </span>
        ))}
      </p>
      <nav
        className="flex flex-wrap border-b border-border"
        aria-label="Knowledge status filters"
      >
        {[
          ["all", "All knowledge"],
          ["published", "Published"],
          ["draft", "Drafts"],
          ["archived", "Archived"],
        ].map(([s, label]) => (
          <Link
            key={s}
            className="filter-tab"
            aria-current={status === s ? "page" : undefined}
            href={`/app/knowledge${s === "all" ? "" : `?status=${s}`}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {params.notice === "draft-saved" && (
        <p
          role="status"
          className="mt-5 bg-success-soft px-4 py-3 text-[13px] text-success"
        >
          Draft saved. Review the content, then publish it for your agent.
        </p>
      )}
      {result.error ? (
        <p role="alert" className="py-6">
          Knowledge could not be loaded. Please try again.
        </p>
      ) : !result.data.length ? (
        <EmptyState
          title={
            status === "all"
              ? "Give Avenlyo approved information it can use."
              : `No ${status} items`
          }
          description="Start with a service description or a customer question. Review the information, then publish it when it’s ready."
          action={action}
        />
      ) : (
        <div>
          {result.data.map((item) => (
            <article className="library-row" key={item.id}>
              <div className="flex min-w-0 gap-3.5">
                {item.type === "faq" ? (
                  <HelpCircle
                    aria-hidden
                    className="mt-1 size-4 text-muted-foreground"
                  />
                ) : (
                  <FileText
                    aria-hidden
                    className="mt-1 size-4 text-muted-foreground"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
                    <h2 className="text-sm font-semibold">{item.title}</h2>
                    <span
                      className="status-text"
                      data-tone={
                        item.status === "published"
                          ? "success"
                          : item.status === "draft"
                            ? "attention"
                            : undefined
                      }
                    >
                      {item.status === "published"
                        ? "Published"
                        : item.status === "draft"
                          ? "Draft"
                          : "Archived"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-[13px] leading-6 text-muted-foreground">
                    {item.content}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {item.type === "faq" ? "FAQ" : "Text"} · Updated{" "}
                    {dateLabel(item.updated_at)}
                  </p>
                </div>
              </div>
              {ctx.role === "owner" && (
                <div className="mt-4 flex flex-wrap items-center gap-3 pl-[30px] lg:mt-0 lg:max-w-[290px] lg:justify-end lg:pl-0">
                  <Link
                    href={`/app/knowledge/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Edit item
                    <ArrowUpRight aria-hidden className="size-3" />
                  </Link>
                  <KnowledgeActions id={item.id} status={item.status} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <p className="mt-5 flex items-center gap-2 text-xs leading-6 text-muted-foreground">
        <BookOpen aria-hidden className="size-3.5" />
        Draft and archived items stay outside your agent’s published knowledge.
      </p>
    </div>
  );
}
