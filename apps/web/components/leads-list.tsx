"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { channelLabels, type Lead } from "@avenlyo-app/shared";
import { Avatar, Badge, EmptyState, Panel } from "./ui";
import { dateLabel, qualificationLabel, screenHref } from "@/lib/presentation";
export function LeadsList({
  leads,
  preview = false,
}: {
  leads: Lead[];
  preview?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const filtered = leads.filter(
    (l) =>
      `${l.name} ${l.email} ${l.company} ${l.summary}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!filter || l.qualification === filter),
  );
  return (
    <>
      <div className="toolbar">
        <label className="search-field">
          <span className="sr-only">Search leads</span>
          <Search aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Search by name, email or company…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="sr-only" htmlFor="lead-filter">
          Qualification
        </label>
        <select
          className="select push-right"
          id="lead-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All qualifications</option>
          {Object.entries(qualificationLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <Panel>
        {filtered.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Inquiry</th>
                  <th>Qualification</th>
                  <th>Source</th>
                  <th>Added</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Link
                        className="row"
                        href={screenHref(`/app/leads/${lead.id}`, preview)}
                      >
                        <Avatar name={lead.name || lead.company || "Visitor"} />
                        <span>
                          <strong>
                            {lead.name || lead.company || "New customer"}
                          </strong>
                          <span
                            className="muted small"
                            style={{
                              display: "block",
                              marginTop: 3,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {lead.email ||
                              lead.phone ||
                              "No contact details yet"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="muted" data-hide-mobile>
                      <span
                        style={{
                          display: "block",
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lead.summary}
                      </span>
                    </td>
                    <td>
                      <Badge
                        tone={
                          lead.qualification === "qualified"
                            ? "success"
                            : lead.qualification === "needs_human"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {qualificationLabel[lead.qualification]}
                      </Badge>
                    </td>
                    <td className="muted" data-mobile-label="Source">
                      {channelLabels[lead.source]}
                    </td>
                    <td className="muted" data-hide-mobile>
                      {dateLabel(lead.created_at)}
                    </td>
                    <td>
                      <Link
                        className="text-link"
                        href={screenHref(`/app/leads/${lead.id}`, preview)}
                      >
                        View lead
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={
              leads.length
                ? "No leads match your search"
                : "Good conversations open doors"
            }
            description={
              leads.length
                ? "Try a different name or qualification."
                : "When your agent identifies an interested customer, their details and inquiry will appear here."
            }
          />
        )}
        <div className="list-footer">
          <span>
            {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
          </span>
          <span>Captured from customer conversations</span>
        </div>
      </Panel>
    </>
  );
}
