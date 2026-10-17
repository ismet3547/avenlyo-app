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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="page-reading">
      <PageHeader
        eyebrow="A curated business library"
        title="Business knowledge"
        description="Only published knowledge is available to your agent. Keep it clear, current and useful."
        action={action}
      />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {["Published items", "Drafts", "Archived items"].map((label, i) => (
          <Card key={label} className="px-4 py-4 sm:px-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-medium tabular-nums">
              {counts[i].error ? "—" : (counts[i].count ?? 0)}
            </p>
          </Card>
        ))}
      </div>
      <div
        className="mb-5 flex flex-wrap gap-1 border-b border-border pb-3"
        aria-label="Knowledge status filters"
      >
        {[
          ["all", "All knowledge"],
          ["published", "Published"],
          ["draft", "Drafts"],
          ["archived", "Archived"],
        ].map(([s, label]) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "outline" : "ghost"}
            asChild
          >
            <Link
              aria-current={status === s ? "page" : undefined}
              href={`/app/knowledge${s === "all" ? "" : `?status=${s}`}`}
            >
              {label}
            </Link>
          </Button>
        ))}
      </div>
      {params.notice === "draft-saved" && (
        <p
          role="status"
          className="mb-5 rounded-md border border-success/15 bg-success-soft p-3 text-sm text-success"
        >
          Draft saved. Review the content, then publish it for your agent.
        </p>
      )}
      {result.error ? (
        <p role="alert">Knowledge could not be loaded. Please try again.</p>
      ) : !result.data.length ? (
        <EmptyState
          title={
            status === "all"
              ? "Give Avenlyo the information it can safely use."
              : `No ${status} items`
          }
          description="Start with a service description or a frequently asked question. Review it, then publish it when it’s ready."
          action={action}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {result.data.map((item) => (
            <article className="p-5 sm:p-6" key={item.id}>
              <div className="flex items-start gap-4">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
                  {item.type === "faq" ? (
                    <HelpCircle aria-hidden className="size-4" />
                  ) : (
                    <FileText aria-hidden className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-medium">{item.title}</h2>
                    <Badge
                      tone={
                        item.status === "published"
                          ? "success"
                          : item.status === "draft"
                            ? "attention"
                            : "neutral"
                      }
                    >
                      {item.status === "published"
                        ? "Published"
                        : item.status === "draft"
                          ? "Draft"
                          : "Archived"}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-[13px] leading-6 text-muted-foreground">
                    {item.content}
                  </p>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {item.type === "faq" ? "FAQ" : "Text"} · Updated{" "}
                    {dateLabel(item.updated_at)}
                  </p>
                  {ctx.role === "owner" && (
                    <div className="mt-4 border-t border-border pt-3">
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
                </div>
              </div>
            </article>
          ))}
        </Card>
      )}
      <p className="mt-5 flex items-center gap-2 text-xs leading-6 text-muted-foreground">
        <BookOpen aria-hidden className="size-3.5" />
        Draft and archived items stay outside your agent’s published knowledge.
      </p>
    </div>
  );
}
