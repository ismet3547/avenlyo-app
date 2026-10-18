import Link from "next/link";
import { Plus, Search, FolderClosed, Library, RotateCcw, ChevronDown } from "lucide-react";
import {
  businessKnowledgeType,
  knowledgeLabels,
  knowledgeTypes,
  type KnowledgeType,
} from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { dateLabel } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { KnowledgeActions } from "@/components/knowledge-actions";
import { KnowledgeCollectionForm } from "@/components/knowledge-collection-form";
import { KnowledgeIcon } from "@/components/knowledge-types";
import { KnowledgeImportPanel } from "@/components/knowledge-import-panel";
import { Button } from "@/components/ui/button";
export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    notice?: string;
    q?: string;
    type?: string;
    collection?: string;
    page?: string;
  }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const status =
    (["draft", "published", "archived"] as const).find(
      (s) => s === params.status,
    ) ?? "all";
  const type = knowledgeTypes.find((t) => t === params.type);
  const search = (params.q ?? "").trim().slice(0, 180);
  const page = Math.max(
    1,
    Math.min(100000, Number.parseInt(params.page ?? "1") || 1),
  );
  const collection = params.collection ?? "";
  const href = (changes: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries({
      q: search || undefined,
      status: status === "all" ? undefined : status,
      type,
      collection: collection || undefined,
      ...changes,
    }))
      if (value) p.set(key, value);
    return `/app/knowledge${p.size ? `?${p}` : ""}`;
  };
  let query = ctx.supabase
    .from("knowledge_items")
    .select(
      "id,type,title,content,price_statement,currency,collection_id,status,updated_at",
      { count: "exact" },
    )
    .eq("workspace_id", ctx.workspace.id)
    .order("updated_at", { ascending: false })
    .order("id")
    .range((page - 1) * 50, page * 50 - 1);
  if (status !== "all") query = query.eq("status", status);
  if (type)
    query =
      type === "custom_note"
        ? query.in("type", ["text", "custom_note"])
        : query.eq("type", type);
  if (collection === "unfiled") query = query.is("collection_id", null);
  else if (/^[0-9a-f-]{36}$/i.test(collection))
    query = query.eq("collection_id", collection);
  if (search) {
    const term = search.replace(/[\\%_,()."]/g, " ");
    query = query.or(
      `title.ilike.%${term}%,content.ilike.%${term}%,price_statement.ilike.%${term}%`,
    );
  }
  const [result, collections, ...counts] = await Promise.all([
    query,
    ctx.supabase
      .from("knowledge_collections")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .order("name"),
    ...(["published", "draft", "archived"] as const).map((s) =>
      ctx.supabase
        .from("knowledge_items")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", ctx.workspace.id)
        .eq("status", s),
    ),
  ]);
  const error =
    result.error || collections.error || counts.some((c) => c.error);
  const total = counts.reduce((n, c) => n + (c.count ?? 0), 0);
  const owner = ctx.role === "owner";
  const selectedCollection = collections.data?.find((c) => c.id === collection);
  return (
    <div className="knowledge-screen">
      <PageHeader
        title="Knowledge"
        description="Information Avenlyo can use with customers."
        action={
          total > 0 && owner ? (
            <Button asChild className="knowledge-main-cta">
              <Link
                href={`/app/knowledge/new${selectedCollection ? `?collection=${selectedCollection.id}` : ""}`}
              >
                <Plus aria-hidden />
                Add knowledge
              </Link>
            </Button>
          ) : undefined
        }
      />
      {error ? (
        <p role="alert" className="py-6">
          Knowledge could not be loaded. Please try again.
        </p>
      ) : total === 0 ? (
        <section className="knowledge-first-workspace">
          <div className="knowledge-first-intro">
            <div>
              <p className="knowledge-kicker">Start here</p>
              <h2>Build your knowledge base.</h2>
              <p>Import what you already have, or add structured business knowledge manually.</p>
            </div>
          </div>
          {owner ? (
            <>
              <div className="knowledge-start-grid">
                <Link href="/app/knowledge/new" className="knowledge-start-manual">
                  <span className="knowledge-start-icon"><Plus aria-hidden /></span>
                  <span>
                    <strong>Add manually</strong>
                    <span>Service, pricing, FAQ, policy and more.</span>
                  </span>
                </Link>
                <KnowledgeImportPanel mode="start" />
              </div>
              <p className="knowledge-manual-types">
                Manual types: Service · Pricing · FAQ · Policy · Business info · Custom note
              </p>
              <div className="knowledge-first-footer">
                <KnowledgeCollectionForm />
              </div>
            </>
          ) : (
            <p>Your workspace owner can add or import business knowledge here.</p>
          )}
        </section>
      ) : (
        <div className="knowledge-library-layout">
          <aside
            className="knowledge-collections"
            aria-label="Knowledge collections"
          >
            <h2>Library</h2>
            <Link
              className="knowledge-collection-link"
              aria-current={!collection ? "page" : undefined}
              href={href({ collection: undefined })}
            >
              <Library aria-hidden className="size-4" />
              All knowledge<span>{total}</span>
            </Link>
            <Link
              className="knowledge-collection-link"
              aria-current={collection === "unfiled" ? "page" : undefined}
              href={href({ collection: "unfiled" })}
            >
              <FolderClosed aria-hidden className="size-4" />
              Unfiled
            </Link>
            <h2 className="mt-7">Collections</h2>
            {collections.data?.map((c) => (
              <Link
                key={c.id}
                className="knowledge-collection-link"
                aria-current={collection === c.id ? "page" : undefined}
                href={href({ collection: c.id })}
              >
                <FolderClosed aria-hidden className="size-4" />
                {c.name}
              </Link>
            ))}
            {owner && <KnowledgeCollectionForm />}
          </aside>
          <section className="min-w-0" aria-label="Knowledge library">
            {owner && <KnowledgeImportPanel mode="toolbar" />}
            <div className="knowledge-library-tools">
              <form
                className="knowledge-search-form"
                action="/app/knowledge"
                role="search"
              >
                <label className="knowledge-search">
                  <Search aria-hidden className="size-4" />
                  <span className="sr-only">Search knowledge</span>
                  <input
                    name="q"
                    defaultValue={search}
                    placeholder="Search knowledge…"
                    maxLength={180}
                  />
                </label>
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="type" value={type ?? ""} />
                <input type="hidden" name="collection" value={collection} />
                <button type="submit" className="sr-only">Search</button>
              </form>
              <div className="knowledge-filter-menus" aria-label="Knowledge filters">
                <details className="knowledge-filter-menu">
                  <summary>
                    <span>type ? knowledgeLabels[type] : "All types"</span>
                    <ChevronDown aria-hidden />
                  </summary>
                  <div className="knowledge-filter-popover">
                    <Link aria-current={!type ? "page" : undefined} href={href({ type: undefined })}>
                      All types
                    </Link>
                    {knowledgeTypes.map((t) => (
                      <Link key={t} aria-current={type === t ? "page" : undefined} href={href({ type: t })}>
                        {knowledgeLabels[t]}
                      </Link>
                    ))}
                  </div>
                </details>
                <details className="knowledge-filter-menu">
                  <summary>
                    <span>
                      {collection === "unfiled"
                        ? "Unfiled"
                        : selectedCollection?.name ?? "All collections"}
                    </span>
                    <ChevronDown aria-hidden />
                  </summary>
                  <div className="knowledge-filter-popover knowledge-filter-popover-right">
                    <Link aria-current={!collection ? "page" : undefined} href={href({ collection: undefined })}>
                      All collections
                    </Link>
                    <Link aria-current={collection === "unfiled" ? "page" : undefined} href={href({ collection: "unfiled" })}>
                      Unfiled
                    </Link>
                    {collections.data?.map((c) => (
                      <Link key={c.id} aria-current={collection === c.id ? "page" : undefined} href={href({ collection: c.id })}>
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </details>
              </div>
            </div>
            <nav
              className="knowledge-status-tabs"
              aria-label="Knowledge status filters"
            >
              {[
                ["all", "All"],
                ["published", "Published"],
                ["draft", "Drafts"],
                ["archived", "Archived"],
              ].map(([s, label], i) => (
                <Link
                  key={s}
                  aria-current={status === s ? "page" : undefined}
                  href={href({ status: s === "all" ? undefined : s })}
                >
                  {label}
                  <span>{i === 0 ? total : counts[i - 1].count}</span>
                </Link>
              ))}
            </nav>
            {params.notice === "imported" && (
              <p role="status" className="knowledge-save-notice">
                Imported as a draft. Review the content, then publish it when ready.
              </p>
            )}
            {params.notice === "draft-saved" &&
              result.data?.some((i) => i.status === "draft") && (
                <p role="status" className="knowledge-save-notice">
                  Draft saved. Review the content, then publish it for your
                  agent.
                </p>
              )}
            {selectedCollection && (
              <div className="knowledge-active-collection">
                <h2>{selectedCollection.name}</h2>
                {owner && (
                  <KnowledgeCollectionForm
                    id={selectedCollection.id}
                    name={selectedCollection.name}
                  />
                )}
              </div>
            )}
            {!result.data?.length ? (
              <div className="knowledge-filter-empty">
                <Search aria-hidden className="size-6" />
                <h2>No knowledge matches these filters.</h2>
                <p>Try a different search, type, status or collection.</p>
                <Link
                  href="/app/knowledge"
                  className="inline-flex items-center gap-2 font-medium text-primary"
                >
                  <RotateCcw aria-hidden className="size-4" />
                  Clear filters
                </Link>
              </div>
            ) : (
              <>
                <div className="knowledge-row-heading" aria-hidden>
                  <span>Type</span>
                  <span>Title / summary</span>
                  <span>Collection</span>
                  <span>Status / updated</span>
                  <span>Actions</span>
                </div>
                <div className="knowledge-rows">
                  {result.data.map((item) => {
                    const t = businessKnowledgeType(
                      item.type as KnowledgeType | "text",
                    );
                    return (
                      <article key={item.id} className="knowledge-row">
                        <div className="knowledge-row-type">
                          <KnowledgeIcon type={t} />
                          <span>{knowledgeLabels[t]}</span>
                        </div>
                        <div className="min-w-0">
                          <h2>
                            {owner ? (
                              <Link href={`/app/knowledge/${item.id}`}>
                                {item.title}
                              </Link>
                            ) : (
                              item.title
                            )}
                          </h2>
                          <p
                            className={
                              t === "pricing" ? "knowledge-pricing-summary" : ""
                            }
                          >
                            {t === "pricing"
                              ? `${item.price_statement}${item.currency ? ` · ${item.currency}` : ""}`
                              : item.content}
                          </p>
                        </div>
                        <div className="knowledge-row-collection">
                          {collections.data?.find(
                            (c) => c.id === item.collection_id,
                          )?.name ?? "Unfiled"}
                        </div>
                        <div className="knowledge-row-status">
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
                          <time dateTime={item.updated_at}>
                            Updated {dateLabel(item.updated_at)}
                          </time>
                        </div>
                        {owner ? (
                          <div className="knowledge-row-actions">
                            <KnowledgeActions
                              id={item.id}
                              status={item.status}
                            />
                          </div>
                        ) : (
                          <span />
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
            {(result.count ?? 0) > 50 && (
              <nav
                className="knowledge-pagination"
                aria-label="Knowledge pages"
              >
                {page > 1 && (
                  <Link href={href({ page: String(page - 1) })}>Previous</Link>
                )}
                <span>
                  Page {page} · {result.count} results
                </span>
                {page * 50 < (result.count ?? 0) && (
                  <Link href={href({ page: String(page + 1) })}>Next</Link>
                )}
              </nav>
            )}
            <p className="knowledge-library-footnote">
              Only published knowledge is available to customers.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
