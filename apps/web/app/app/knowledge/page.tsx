import { QueryError } from "@/components/query-error";
import Link from "next/link";
import { Plus, ArrowUpRight, Globe, FileText, HelpCircle } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { KnowledgeActions } from "@/components/knowledge-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, PAGE_SIZE, pageNumber } from "@/components/pagination";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
const notices: Record<string, string> = {
  "draft-saved":
    "Draft saved. Review the content, then publish it for your agent.",
  published: "Published. Your agent can now use this item.",
  unpublished: "Unpublished. Your agent will no longer use this item.",
  archived: "Item archived. You can publish it again when ready.",
  deleted: "Item permanently deleted.",
};
export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    notice?: string;
    item?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const search = (params.q ?? "").trim().slice(0, 100);
  const status = ["draft", "published", "archived"].includes(
    params.status ?? "",
  )
    ? params.status
    : "all";
  let query = ctx.supabase
    .from("knowledge_items")
    .select("id,type,title,content,status,updated_at", { count: "exact" })
    .eq("workspace_id", ctx.workspace.id)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (status !== "all")
    query = query.eq("status", status as "draft" | "published" | "archived");
  if (search)
    query = query.ilike("title", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
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
      <form className="mb-4 flex gap-2" method="get">
        {status !== "all" && (
          <input type="hidden" name="status" value={status} />
        )}
        <label htmlFor="knowledge-search" className="sr-only">
          Search knowledge titles
        </label>
        <Input
          id="knowledge-search"
          name="q"
          defaultValue={search}
          maxLength={100}
          placeholder="Search titles and questions…"
          className="max-w-md"
        />
        <Button variant="outline" type="submit">
          Search
        </Button>
      </form>
      <nav
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
              aria-current={status === s ? "page" : undefined}
              className="capitalize"
              href={`/app/knowledge?${new URLSearchParams({ ...(s === "all" ? {} : { status: s }), ...(search ? { q: search } : {}) })}`}
            >
              {s}
            </Link>
          </Button>
        ))}
      </nav>
      {params.notice && Object.hasOwn(notices, params.notice) && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
        >
          {notices[params.notice]}
          {params.notice === "published" && (
            <Link href="/app/test-agent" className="ml-2 font-medium underline">
              Test published knowledge →
            </Link>
          )}
        </div>
      )}
      {result.error ? (
        <QueryError message="Knowledge could not be loaded. Try again to check your business content." />
      ) : !result.data.length ? (
        <EmptyState
          title={
            search || page
              ? "No knowledge matches"
              : status === "all"
                ? "Teach your agent about your business"
                : `No ${status} items`
          }
          description={
            status !== "all" || search || page > 0
              ? "Try another filter or return to all knowledge items."
              : "Start with a service description or a frequently asked question. Keep information clear and accurate."
          }
          action={
            status !== "all" || search || page > 0 ? (
              <Button asChild variant="outline">
                <Link href="/app/knowledge">View all knowledge</Link>
              </Button>
            ) : (
              action
            )
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.data.map((item) => (
            <Card
              id={`knowledge-${item.id}`}
              className={`scroll-mt-6 p-5 ${params.item === item.id ? "ring-2 ring-primary/30" : ""}`}
              key={item.id}
            >
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
                  <KnowledgeActions
                    workspaceId={ctx.workspace.id}
                    id={item.id}
                    status={item.status}
                  />
                </>
              )}
            </Card>
          ))}
        </div>
      )}
      {!result.error && (
        <Pagination
          pathname="/app/knowledge"
          page={page}
          total={result.count ?? 0}
          filters={{ status, q: search }}
        />
      )}
      <Card className="mt-7 flex flex-wrap items-center gap-4 bg-transparent p-5 shadow-none">
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
