"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, BookOpen, FileText, Plus, Search } from "lucide-react";
import {
  businessKnowledgeType,
  knowledgeLabels,
  type KnowledgeCollection,
  type KnowledgeItem,
} from "@avenlyo-app/shared";
import { ActionLink, Badge, EmptyState, Panel } from "./ui";
import { KnowledgeActions } from "./product-forms";
import { dateLabel, screenHref } from "@/lib/presentation";
export function KnowledgeLibrary({
  items,
  collections,
  editable,
  initialCollection = "",
  preview = false,
}: {
  items: KnowledgeItem[];
  collections: KnowledgeCollection[];
  editable: boolean;
  initialCollection?: string;
  preview?: boolean;
}) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState(initialCollection);
  const [type, setType] = useState("");
  const filtered = items.filter(
    (item) =>
      (status === "all"
        ? item.status !== "archived"
        : item.status === status) &&
      (!collection || item.collection_id === collection) &&
      (!type || businessKnowledgeType(item.type) === type) &&
      `${item.title} ${item.content} ${item.price_statement} ${item.currency}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="tabs" role="group" aria-label="Knowledge status">
        {[
          ["all", "All knowledge"],
          ["published", "Published"],
          ["draft", "Drafts"],
          ["archived", "Archived"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`tab ${status === value ? "is-active" : ""}`}
            style={{
              background: "none",
              borderLeft: 0,
              borderTop: 0,
              borderRight: 0,
            }}
            id={`knowledge-tab-${value}`}
            aria-controls="knowledge-results"
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {label}
            <span className="tab-count">
              {
                items.filter((i) =>
                  value === "all"
                    ? i.status !== "archived"
                    : i.status === value,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="toolbar">
        <label className="search-field">
          <span className="sr-only">Search knowledge</span>
          <Search aria-hidden="true" />
          <input
            className="input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your knowledge…"
          />
        </label>
        <label className="sr-only" htmlFor="knowledge-type-filter">
          Knowledge type filter
        </label>
        <select
          className="select"
          id="knowledge-type-filter"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All types</option>
          {Object.entries(knowledgeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="collection-filter">
          Filter collection
        </label>
        <select
          className="select push-right"
          id="collection-filter"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Panel>
        <div
          id="knowledge-results"
          role="region"
          aria-labelledby={`knowledge-tab-${status}`}
        >
          <div className="sr-only" role="status">
            {filtered.length} knowledge items
          </div>
          {filtered.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Last updated</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link
                          className="item-title"
                          href={screenHref(
                            `/app/knowledge/${item.id}`,
                            preview,
                          )}
                        >
                          <span className="item-icon">
                            <FileText aria-hidden="true" />
                          </span>
                          <span>{item.title}</span>
                        </Link>
                        <p className="item-subtitle">
                          {item.type === "pricing"
                            ? `${item.price_statement}${item.currency ? ` · ${item.currency}` : ""}`
                            : collections.find(
                                (c) => c.id === item.collection_id,
                              )?.name || "No collection"}
                        </p>
                      </td>
                      <td className="muted" data-mobile-label="Type">
                        {knowledgeLabels[businessKnowledgeType(item.type)]}
                      </td>
                      <td>
                        <Badge
                          tone={
                            item.status === "published"
                              ? "success"
                              : item.status === "draft"
                                ? "warning"
                                : "neutral"
                          }
                          dot
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="muted" data-hide-mobile>
                        {dateLabel(item.updated_at)}
                      </td>
                      <td>
                        {preview ? (
                          <Link
                            className="text-link"
                            href={screenHref(`/app/knowledge/${item.id}`, true)}
                          >
                            View
                            <ArrowUpRight aria-hidden="true" />
                          </Link>
                        ) : (
                          <KnowledgeActions item={item} editable={editable} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="knowledge"
              title={
                items.length
                  ? "No matching knowledge"
                  : "A home for everything your business knows"
              }
              description={
                items.length
                  ? "Try another search, status or collection."
                  : "Add services, policies and answers. Your agent uses only the items you publish."
              }
              action={
                !items.length && (
                  <ActionLink href={screenHref("/app/knowledge/new", preview)}>
                    <Plus aria-hidden="true" />
                    Add knowledge
                  </ActionLink>
                )
              }
            />
          )}
        </div>
        <div className="list-footer">
          <span>
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </span>
          <span className="section-note">
            <BookOpen aria-hidden="true" />
            Only published knowledge is used by your agent
          </span>
        </div>
      </Panel>
    </>
  );
}
