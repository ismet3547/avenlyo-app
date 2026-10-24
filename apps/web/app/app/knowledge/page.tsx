import Link from "next/link";
import { Plus, ArrowUpRight, Globe, FileText, HelpCircle } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
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
        eyebrow="Business knowledge"
        title="Good answers start here"
        description="Add information directly. No website needed. Only published items are available to your agent."
        action={action}
      />
      <div
        className="mb-6 flex flex-wrap gap-2"
        aria-label="Knowledge status filters"
      >
        {["all", "published", "draft", "archived"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "default" : "ghost"}
            asChild
          >
            <Link
              className="capitalize"
              href={`/app/knowledge${s === "all" ? "" : `?status=${s}`}`}
            >
              {s}
            </Link>
          </Button>
        ))}
      </div>
      {params.notice === "draft-saved" && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          Draft saved. Review the content, then publish it for your agent.
        </p>
      )}
      {result.error ? (
        <p role="alert">
          Knowledge could not be loaded. Check your local database setup.
        </p>
      ) : !result.data.length ? (
        <EmptyState
          title={
            status === "all"
              ? "Teach your agent about your business"
              : `No ${status} items`
          }
          description="Start with a service description or a frequently asked question. Keep information clear and accurate."
          action={action}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.data.map((item) => (
            <Card className="p-5" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.type === "faq" ? (
                    <HelpCircle className="size-4" aria-hidden />
                  ) : (
                    <FileText className="size-4" aria-hidden />
                  )}
                  {item.type === "faq" ? "FAQ" : "Text"}
                </div>
                <Badge
                  className={
                    item.status === "published"
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : ""
                  }
                >
                  {item.status === "published"
                    ? "Published"
                    : item.status === "draft"
                      ? "Draft"
                      : "Archived"}
                </Badge>
              </div>
              <h2 className="mt-4 text-sm font-semibold leading-6">
                {item.title}
              </h2>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {item.content}
              </p>
              {ctx.role === "owner" && (
                <>
                  <Link
                    href={`/app/knowledge/${item.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    Edit item
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                  <KnowledgeActions workspaceId={ctx.workspace.id} id={item.id} status={item.status} />
                </>
              )}
            </Card>
          ))}
        </div>
      )}
      <Card className="mt-7 flex items-center gap-4 bg-transparent p-5 shadow-none">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
          <Globe aria-hidden className="size-5 text-muted-foreground" />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-medium">Website import</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Another way to add knowledge. Manual text and FAQs work today.
          </p>
        </div>
        <Badge>Coming next</Badge>
      </Card>
    </>
  );
}
