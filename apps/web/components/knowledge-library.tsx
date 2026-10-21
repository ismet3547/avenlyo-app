"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowRight,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  businessKnowledgeType,
  knowledgeLabels,
  type KnowledgeCollection,
  type KnowledgeItem,
} from "@avenlyo-app/shared";
import { filterKnowledge, knowledgeUpdatedLabel } from "@/lib/knowledge-model";
import { screenHref } from "@/lib/presentation";
import { knowledgeEditorOperation } from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import {
  AddKnowledge,
  KnowledgeBack,
  KnowledgeCreationChoices,
  KnowledgeDialog,
  KnowledgeStatus,
} from "./knowledge-primitives";
function RestoreKnowledge({
  item,
  editable,
}: {
  item: KnowledgeItem;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(knowledgeEditorOperation, {
    status: "idle",
    message: "",
  } as FormState);
  return (
    <form action={action} className="knowledge-row-restore">
      <input type="hidden" name="id" value={item.id} />
      <button
        className="text-link"
        name="intent"
        value="draft"
        disabled={!editable || pending}
      >
        {pending ? "Restoring…" : "Restore"}
      </button>
      {state.status === "error" && <p role="alert">{state.message}</p>}
    </form>
  );
}
export function KnowledgeLibrary({
  items,
  collections,
  editable,
  initialCollection = "",
  preview = false,
  archived = false,
  now = Date.now(),
}: {
  items: KnowledgeItem[];
  collections: KnowledgeCollection[];
  editable: boolean;
  initialCollection?: string;
  preview?: boolean;
  archived?: boolean;
  now?: number;
}) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState(initialCollection);
  const [type, setType] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const active = items.filter((item) => item.status !== "archived");
  const zero = !archived && active.length === 0;
  const filtered = filterKnowledge(items, {
    archived,
    status,
    query,
    type,
    collection,
  });
  const filterCount = Number(Boolean(type)) + Number(Boolean(collection));
  const clear = () => {
    setQuery("");
    setType("");
    setCollection("");
    setStatus("all");
  };
  return (
    <div
      className={`knowledge-library ${zero ? "is-zero" : "is-populated"} ${archived ? "is-archived" : ""}`}
    >
      {archived && <KnowledgeBack />}
      <header className="knowledge-heading">
        <div>
          <h1>{archived ? "Archived knowledge" : "Knowledge"}</h1>
          {!zero && (
            <p>
              {archived
                ? "Archived information is unavailable to your agent. Restore it as a draft to review it again."
                : "Information Avenlyo can use when answering customers."}
            </p>
          )}
        </div>
        {!archived && !zero && (
          <div className="knowledge-heading-actions">
            {editable && <AddKnowledge preview={preview} />}
            <details className="knowledge-overflow">
              <summary
                className="knowledge-icon-button"
                aria-label="Organize knowledge"
              >
                <MoreHorizontal aria-hidden="true" />
              </summary>
              <div>
                <Link href={screenHref("/app/knowledge/archived", preview)}>
                  View archived
                </Link>
                <Link href={screenHref("/app/knowledge/collections", preview)}>
                  Manage collections
                </Link>
              </div>
            </details>
          </div>
        )}
      </header>
      {zero ? (
        <div className="knowledge-zero">
          <p className="knowledge-zero-lead">
            Give Avenlyo the information it needs
            <br className="knowledge-desktop-break" /> to answer customers
            accurately.
          </p>
          <div className="knowledge-zero-desktop">
            <KnowledgeCreationChoices preview={preview} disabled={!editable} />
          </div>
          {editable && <AddKnowledge preview={preview} mobileOnly />}
          <p className="knowledge-zero-support">
            Add services, pricing, FAQs, policies or other business information.
          </p>
          {!editable && <p>Ask your workspace owner to add knowledge.</p>}
        </div>
      ) : (
        <>
          <div className="knowledge-search-row">
            <label className="knowledge-search">
              <Search aria-hidden="true" />
              <span className="sr-only">
                {archived ? "Search archived knowledge" : "Search knowledge"}
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  archived ? "Search archived knowledge" : "Search knowledge"
                }
              />
            </label>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal aria-hidden="true" />
              Filter{filterCount > 0 ? ` · ${filterCount}` : ""}
            </button>
          </div>
          {!archived && (
            <div
              className="knowledge-status-nav"
              role="group"
              aria-label="Knowledge status"
            >
              {[
                ["all", "All"],
                ["published", "Published"],
                ["draft", "Drafts"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={status === value}
                  onClick={() => setStatus(value)}
                >
                  {label}
                  {value === "draft" &&
                    active.some((i) => i.status === "draft") && (
                      <span>
                        {active.filter((i) => i.status === "draft").length}
                      </span>
                    )}
                </button>
              ))}
            </div>
          )}
          {status === "published" && (
            <p className="knowledge-published-help">
              Published knowledge is available to your agent.
            </p>
          )}
          <div role="status" className="sr-only">
            {filtered.length} knowledge results
          </div>
          {filtered.length ? (
            <ul className="knowledge-list">
              {filtered.map((item) => (
                <li key={item.id}>
                  <Link
                    className="knowledge-row"
                    href={screenHref(`/app/knowledge/${item.id}`, preview)}
                  >
                    <div>
                      <h2>{item.title}</h2>
                      <p>
                        {knowledgeLabels[businessKnowledgeType(item.type)]}
                        <span aria-hidden="true"> · </span>
                        <KnowledgeStatus status={item.status} />
                      </p>
                    </div>
                    <time dateTime={item.updated_at}>
                      {knowledgeUpdatedLabel(item.updated_at, now)}
                    </time>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  {archived && !preview && editable && (
                    <RestoreKnowledge item={item} editable={editable} />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="knowledge-no-results">
              <h2>
                {archived && !query && !filterCount
                  ? "No archived knowledge"
                  : "No results"}
              </h2>
              <p>
                {archived && !query && !filterCount
                  ? "Archived knowledge will appear here."
                  : "Try another search or clear your filters."}
              </p>
              {(query || filterCount || status !== "all") && (
                <button type="button" className="text-link" onClick={clear}>
                  Clear filters
                </button>
              )}
            </div>
          )}
          <KnowledgeDialog
            open={filterOpen}
            close={() => setFilterOpen(false)}
            title="Filter knowledge"
          >
            <form
              key={`${type}:${collection}:${filterOpen}`}
              className="knowledge-filter-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setType(String(data.get("type") ?? ""));
                setCollection(String(data.get("collection") ?? ""));
                setFilterOpen(false);
              }}
            >
              <fieldset>
                <legend>Type</legend>
                <div className="knowledge-type-filters">
                  {[["", "All"], ...Object.entries(knowledgeLabels)].map(
                    ([value, label]) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="type"
                          value={value}
                          defaultChecked={type === value}
                        />
                        {label}
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
              {collections.length > 0 && (
                <label className="knowledge-field">
                  <span>Collection</span>
                  <select
                    className="select"
                    name="collection"
                    defaultValue={collection}
                  >
                    <option value="">All collections</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="knowledge-dialog-actions">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => {
                    clear();
                    setFilterOpen(false);
                  }}
                >
                  Clear filters
                </button>
                <button className="button button-primary">Apply filters</button>
              </div>
            </form>
          </KnowledgeDialog>
        </>
      )}
    </div>
  );
}
