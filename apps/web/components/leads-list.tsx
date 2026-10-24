"use client";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { channelLabels, type Lead } from "@avenlyo-app/shared";
import { EmptyState, Panel } from "./ui";
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
          <ul className="record-list">
            {filtered.map((lead) => (
              <li key={lead.id}>
                <h2>
                  <Link href={screenHref(`/app/leads/${lead.id}`, preview)}>
                    {lead.name || lead.company || "New customer"}
                  </Link>
                </h2>
                <p className="small muted">
                  {lead.email || lead.phone || "No contact details yet"}
                </p>
                <p>{lead.summary}</p>
                <dl className="detail-dl">
                  <div>
                    <dt>Qualification</dt>
                    <dd>{qualificationLabel[lead.qualification]}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{channelLabels[lead.source]}</dd>
                  </div>
                  <div>
                    <dt>Added</dt>
                    <dd>{dateLabel(lead.created_at)}</dd>
                  </div>
                </dl>
                <Link
                  className="text-link"
                  href={screenHref(`/app/leads/${lead.id}`, preview)}
                >
                  View lead
                </Link>
              </li>
            ))}
          </ul>
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
