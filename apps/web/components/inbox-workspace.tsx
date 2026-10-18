"use client";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Inbox,
  MessageCircle,
  Search,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { channelLabels, type InboxItem } from "@avenlyo-app/shared";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { dateLabel } from "@/lib/utils";
import { customerLabel, filterInbox } from "@/lib/inbox";

export function InboxWorkspace({
  items,
  actorId,
  selectedId,
  page = 0,
  failed = false,
  children,
}: {
  items: InboxItem[];
  actorId: string;
  selectedId?: string;
  page?: number;
  failed?: boolean;
  children?: ReactNode;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const initialFilter = params.get("filter") ?? "all";
  const [filter, setFilter] = useState(
    ["all", "paused", "mine"].includes(initialFilter) ? initialFilter : "all",
  );
  const [search, setSearch] = useState((params.get("q") ?? "").slice(0, 200));
  function queueQuery(targetPage = page) {
    const query = new URLSearchParams();
    if (targetPage) query.set("page", String(targetPage));
    if (filter !== "all") query.set("filter", filter);
    if (search.trim()) query.set("q", search.trim());
    return query.size ? `?${query}` : "";
  }
  const visible = filterInbox(items, filter, search, actorId);
  return (
    <section className="inbox-workspace" aria-label="Customer inbox">
      <header className="inbox-topbar">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Inbox</h1>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Customer conversations, together.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh Inbox"
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            <RefreshCw
              className={refreshing ? "animate-spin" : ""}
              aria-hidden
            />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/channels">
              Channels
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </header>
      <div className="inbox-body">
        <aside
          className={`inbox-queue ${selectedId ? "has-selection" : ""}`}
          aria-label="Conversation list"
        >
          <label className="queue-search">
            <span className="sr-only">Search this page of conversations</span>
            <Search aria-hidden />
            <Input
              type="search"
              maxLength={200}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this page…"
            />
          </label>
          <div className="queue-filters" aria-label="Filter this page">
            {[
              ["all", "All"],
              ["paused", "AI paused"],
              ["mine", "Mine"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="queue-filter"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="queue-scroll">
            {failed ? (
              <p role="alert" className="p-6 text-xs leading-6 text-red-700">
                The conversation list could not be loaded. Reload to try again.
              </p>
            ) : visible.length ? (
              visible.map((c) => {
                const Icon =
                  c.channel === "website_chat" ? Globe : MessageCircle;
                return (
                  <Link
                    key={c.id}
                    prefetch={false}
                    href={`/app/inbox/${c.id}${queueQuery()}`}
                    aria-current={selectedId === c.id ? "page" : undefined}
                    className="queue-item"
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                        {customerLabel(c.channel, c.customerRef)}
                      </span>
                      <time
                        dateTime={c.updatedAt}
                        className="shrink-0 text-[11px] text-muted-foreground"
                      >
                        {dateLabel(c.updatedAt)}
                      </time>
                    </div>
                    <p className="mt-2 line-clamp-2 break-words text-xs leading-5 text-muted-foreground">
                      {c.preview ?? "Waiting for the first message."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="size-3" aria-hidden />
                        {channelLabels[c.channel]}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 ${c.aiMode === "paused" ? "text-amber-800" : "text-primary"}`}
                      >
                        <span className="status-dot" />
                        {c.aiMode === "paused" ? "AI paused" : "AI active"}
                      </span>
                      {c.assigneeId && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <UserRound className="size-3" aria-hidden />
                          {c.assigneeId === actorId ? "You" : "Team member"}
                        </span>
                      )}
                      {c.needsAttention && (
                        <span className="text-red-700">
                          Delivery needs attention
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <Inbox
                  className="mx-auto size-6 text-muted-foreground"
                  aria-hidden
                />
                <h2 className="mt-4 text-sm font-medium">
                  {items.length
                    ? "No matching conversations"
                    : "Your next conversation starts here"}
                </h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {items.length
                    ? "Try another search or filter on this page."
                    : "Connect a customer channel. Test Agent conversations stay in test history."}
                </p>
                {!items.length && (
                  <Button size="sm" variant="outline" asChild className="mt-5">
                    <Link href="/app/channels">Set up a channel</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
          <footer className="queue-footer">
            <span>{items.length} on this page · tests excluded</span>
            <div className="flex gap-1">
              {page > 0 && (
                <Button size="icon" variant="ghost" asChild className="size-7">
                  <Link
                    href={`/app/inbox${queueQuery(page - 1)}`}
                    aria-label="Previous conversations"
                  >
                    <ArrowLeft aria-hidden />
                  </Link>
                </Button>
              )}
              {items.length === 50 && (
                <Button size="icon" variant="ghost" asChild className="size-7">
                  <Link
                    href={`/app/inbox${queueQuery(page + 1)}`}
                    aria-label="Next conversations"
                  >
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              )}
            </div>
          </footer>
        </aside>
        {children ? (
          <div className="inbox-detail">{children}</div>
        ) : (
          <div className="inbox-placeholder flex-1 flex-col items-center justify-center p-10 text-center">
            <span className="grid size-16 place-items-center rounded-2xl border border-border bg-muted/50">
              <MessageCircle
                className="size-7 text-primary"
                strokeWidth={1.4}
                aria-hidden
              />
            </span>
            <h2 className="mt-6 text-xl font-medium tracking-tight">
              Every conversation has a next step.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">
              Select a conversation to read the story so far, review its status,
              and help your customer.
            </p>
            <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
              <UserRound className="size-3.5" aria-hidden />
              Claim a thread to reply personally.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
