"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Info,
  LogOut,
  Play,
  RotateCcw,
  Sparkles,
  UserRound,
} from "lucide-react";
import { channelLabels, type InboxThread } from "@avenlyo-app/shared";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { dateLabel } from "@/lib/utils";
import { customerLabel, mergeThread } from "@/lib/inbox";

export function InboxConversation({
  initial,
  actorId,
  page = 0,
}: {
  initial: InboxThread;
  actorId: string;
  page?: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const backQuery = new URLSearchParams();
  if (page) backQuery.set("page", String(page));
  if (["paused", "mine"].includes(params.get("filter") ?? ""))
    backQuery.set("filter", params.get("filter")!);
  if (params.get("q")) backQuery.set("q", params.get("q")!.slice(0, 200));
  const backHref = `/app/inbox${backQuery.size ? `?${backQuery}` : ""}`;
  const [snapshot, setSnapshot] = useState(initial);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [historyPending, setHistoryPending] = useState(false);
  const [error, setError] = useState("");
  const [liveError, setLiveError] = useState(false);
  const [notice, setNotice] = useState("");
  const [hasEarlier, setHasEarlier] = useState(initial.hasEarlier);
  const [retry, setRetry] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const request = useRef<{ clientMessageId: string; content: string } | null>(
    null,
  );
  const busy = useRef(false);
  const thread = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const followLatest = useRef(true);
  const earlierHeight = useRef<number | null>(null);
  const lastMessage = useRef(initial.messages.at(-1)?.id);
  const id = initial.conversation.id;
  const c = snapshot.conversation;
  const mine = c.assignee_id === actorId;
  const other = Boolean(c.assignee_id && !mine);
  const instagram = c.channel === "instagram";
  const bytes = new TextEncoder().encode(content.trim()).length;

  useLayoutEffect(() => {
    const node = thread.current;
    if (!node) return;
    if (earlierHeight.current !== null) {
      node.scrollTop += node.scrollHeight - earlierHeight.current;
      earlierHeight.current = null;
    } else if (followLatest.current) node.scrollTop = node.scrollHeight;
    else if (lastMessage.current !== snapshot.messages.at(-1)?.id)
      setHasNew(true);
    lastMessage.current = snapshot.messages.at(-1)?.id;
  }, [snapshot.messages]);

  useEffect(() => {
    if (mine && !pending && !retry)
      composer.current?.focus({ preventScroll: true });
  }, [mine, pending, retry]);

  async function refresh(before?: string) {
    const response = await fetch(
      `/api/inbox/${id}${before ? `?before=${before}` : ""}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error("Thread unavailable");
    const next = (await response.json()) as InboxThread;
    if (before && thread.current)
      earlierHeight.current = thread.current.scrollHeight;
    setSnapshot((prev) => mergeThread(prev, next));
    if (before) setHasEarlier(next.hasEarlier);
    setLiveError(false);
  }

  useEffect(() => {
    let stopped = false;
    let polling = false;
    async function poll() {
      if (polling || busy.current || document.visibilityState === "hidden")
        return;
      polling = true;
      try {
        const response = await fetch(`/api/inbox/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Thread unavailable");
        const next = (await response.json()) as InboxThread;
        if (!stopped) {
          setSnapshot((prev) => mergeThread(prev, next));
          setLiveError(false);
        }
      } catch {
        if (!stopped) setLiveError(true);
      } finally {
        polling = false;
      }
    }
    const timer = setInterval(() => void poll(), 4000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id]);

  async function action(operation: "claim" | "release" | "resume") {
    if (busy.current || other || (retry && operation !== "claim")) return;
    busy.current = true;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/inbox/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation }),
      });
      if (!response.ok) throw new Error("Team action unavailable");
      setNotice(
        operation === "resume"
          ? "AI resumed for the next customer message. Earlier unanswered messages are unchanged."
          : operation === "release"
            ? "Conversation released. AI remains paused."
            : "Conversation claimed. AI remains paused.",
      );
    } catch {
      setError(
        "Could not confirm this change. Another team member may have claimed the conversation. Check the latest state before trying again.",
      );
    }
    try {
      await refresh();
    } catch {
      setLiveError(true);
    }
    router.refresh();
    busy.current = false;
    setPending(false);
  }

  async function reply(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !mine || !content.trim() || (instagram && bytes > 1000))
      return;
    if (!request.current)
      request.current = {
        clientMessageId: crypto.randomUUID(),
        content: content.trim(),
      };
    const submitted = request.current;
    busy.current = true;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/inbox/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "reply", ...submitted }),
      });
      if (!response.ok) throw new Error("Reply unavailable");
      const result = (await response.json()) as {
        delivery: { status: string };
      };
      request.current = null;
      setContent("");
      setRetry(false);
      setNotice(
        result.delivery.status === "available"
          ? "Human reply saved and available to the website visitor. AI remains paused."
          : result.delivery.status === "sent"
            ? "Human reply accepted by Instagram. AI remains paused."
            : result.delivery.status === "unknown"
              ? "Reply saved. Instagram delivery is unconfirmed; check the thread before sending another reply. AI remains paused."
              : "Reply saved. Check its delivery state in the thread. AI remains paused.",
      );
      followLatest.current = true;
    } catch {
      setRetry(true);
      setError(
        "The reply result is unconfirmed. Retry uses the same message to avoid a duplicate. Check the thread before creating another reply.",
      );
      busy.current = false;
      setPending(false);
      return;
    }
    // A confirmed reply must never become a new retry because the following read failed.
    try {
      await refresh();
    } catch {
      setLiveError(true);
    }
    router.refresh();
    busy.current = false;
    setPending(false);
  }

  const name =
    snapshot.lead?.name ?? customerLabel(c.channel, c.external_customer_ref);
  return (
    <>
      <header className="thread-header">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 md:hidden"
          >
            <Link href={backHref} aria-label="Back to conversations">
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
          <span className="hidden size-10 shrink-0 place-items-center rounded-full border border-border bg-muted text-xs font-medium sm:grid">
            {snapshot.lead?.name ? (
              snapshot.lead.name.slice(0, 2).toUpperCase()
            ) : (
              <UserRound className="size-4 text-muted-foreground" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{name}</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {channelLabels[c.channel]}
              {mine
                ? " · Claimed by you"
                : other
                  ? " · Claimed by a team member"
                  : " · Unassigned"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            className={
              c.ai_mode === "paused" ? "status-warning" : "status-success"
            }
          >
            <span className="status-dot" />
            <span className="hidden sm:inline">
              {c.ai_mode === "paused" ? "Needs human · " : ""}
            </span>
            {c.ai_mode === "paused" ? "AI paused" : "AI active"}
          </Badge>
          <details className="thread-context">
            <summary aria-label="Conversation details">
              <Info className="size-4" aria-hidden />
            </summary>
            <div className="thread-context-panel">
              <h3 className="text-sm font-semibold">Conversation details</h3>
              <dl className="mt-5 space-y-4 text-xs">
                <div>
                  <dt className="text-muted-foreground">
                    Customer channel reference
                  </dt>
                  <dd className="mt-1.5 break-all">
                    {c.external_customer_ref ?? "Unavailable"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ownership</dt>
                  <dd className="mt-1.5">
                    {mine
                      ? "Claimed by you"
                      : other
                        ? "Claimed by a team member"
                        : "Unassigned"}
                  </dd>
                </div>
                {snapshot.lead && (
                  <div>
                    <dt className="text-muted-foreground">Linked inquiry</dt>
                    <dd className="mt-1.5">
                      <Link
                        href={`/app/leads/${snapshot.lead.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        View linked lead →
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
              {snapshot.notifications.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <h4 className="text-xs font-semibold">Staff notifications</h4>
                  {snapshot.notifications.map((n) => (
                    <p
                      key={n.id}
                      className="mt-3 text-[11px] leading-5 text-muted-foreground"
                    >
                      {n.kind === "qualified_lead"
                        ? "Qualified inquiry"
                        : "Human assistance"}{" "}
                      ·{" "}
                      {n.status === "sent"
                        ? "email accepted"
                        : n.status === "unknown"
                          ? "delivery unconfirmed"
                          : n.status === "failed"
                            ? "email failed"
                            : n.status === "suppressed"
                              ? "no verified owner recipient"
                              : n.status}
                    </p>
                  ))}
                </div>
              )}
              {instagram && (
                <p className="mt-5 border-t border-border pt-4 text-[11px] leading-6 text-muted-foreground">
                  Human replies must be within 24 hours of the customer’s last
                  Instagram message. An expired window is blocked and shown in
                  the thread.
                </p>
              )}
            </div>
          </details>
        </div>
      </header>
      {snapshot.lead && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-2 text-[11px]">
          <span className="text-muted-foreground">
            Linked lead ·{" "}
            {snapshot.lead.qualification === "qualified"
              ? "Qualified"
              : snapshot.lead.qualification === "needs_human"
                ? "Needs human"
                : "Needs info"}
          </span>
          <Link
            className="font-medium text-primary"
            href={`/app/leads/${snapshot.lead.id}`}
          >
            View linked lead →
          </Link>
        </div>
      )}
      {liveError && (
        <p
          role="status"
          className="thread-feedback border-b border-amber-200 bg-amber-50 text-amber-800"
        >
          Live updates are interrupted. Reconnecting automatically; the
          conversation below may be out of date.
        </p>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={thread}
          role="log"
          aria-live="polite"
          aria-label="Conversation thread"
          className="thread-scroll"
          onScroll={(event) => {
            const node = event.currentTarget;
            followLatest.current =
              node.scrollHeight - node.scrollTop - node.clientHeight < 80;
            if (followLatest.current) setHasNew(false);
          }}
        >
          {hasEarlier && (
            <div className="mb-6 text-center">
              <Button
                size="sm"
                variant="outline"
                disabled={historyPending}
                onClick={async () => {
                  setHistoryPending(true);
                  try {
                    await refresh(snapshot.messages[0]?.id);
                  } catch {
                    setError("Earlier messages could not be loaded.");
                  } finally {
                    setHistoryPending(false);
                  }
                }}
              >
                {historyPending ? "Loading…" : "Load earlier messages"}
              </Button>
            </div>
          )}
          {!snapshot.messages.length && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Waiting for the first customer message.
            </p>
          )}
          {snapshot.messages.map((m) => {
            const delivery = snapshot.deliveries.find(
              (d) => d.message_id === m.id,
            );
            return (
              <article key={m.id} className="thread-message" data-role={m.role}>
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    {m.role === "assistant" && (
                      <Sparkles className="size-3 text-primary" aria-hidden />
                    )}
                    {m.role === "customer"
                      ? "Customer"
                      : m.role === "human"
                        ? "Team · human reply"
                        : "Avenlyo · AI"}
                  </span>
                  <time dateTime={m.created_at}>{dateLabel(m.created_at)}</time>
                </div>
                <div className="message-body">
                  <p className="whitespace-pre-wrap break-words text-sm leading-7">
                    {m.content}
                  </p>
                </div>
                {delivery && (
                  <p
                    className={`mt-2 text-[11px] leading-5 ${["unknown", "failed", "blocked"].includes(delivery.status) ? "text-red-700" : "text-muted-foreground"}`}
                  >
                    {delivery.status === "available"
                      ? "Available to visitor"
                      : delivery.status === "sent"
                        ? "Accepted by Instagram"
                        : delivery.status === "unknown"
                          ? "Delivery unconfirmed · automatic resend stopped"
                          : delivery.status === "failed"
                            ? "Delivery failed · automatic resend stopped"
                            : delivery.status === "blocked"
                              ? "Delivery blocked"
                              : "Delivery pending"}
                    {delivery.error_code
                      ? ` · ${delivery.error_code.replaceAll("_", " ").toLowerCase()}`
                      : ""}
                  </p>
                )}
              </article>
            );
          })}
        </div>
        {hasNew && (
          <Button
            size="sm"
            variant="outline"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-md"
            onClick={() => {
              followLatest.current = true;
              if (thread.current)
                thread.current.scrollTop = thread.current.scrollHeight;
              setHasNew(false);
            }}
          >
            <ArrowDown aria-hidden />
            New messages
          </Button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="thread-feedback border-t border-red-100 bg-red-50 text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="thread-feedback border-t border-border text-primary"
        >
          {notice}
        </p>
      )}
      {mine ? (
        <div className="border-t border-border pt-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium">
              <UserRound className="size-3.5" aria-hidden />
              Your human reply
              <span className="ml-1 font-normal text-muted-foreground">
                · AI stays paused
              </span>
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40"
                aria-label="Release conversation"
                disabled={pending || retry}
                onClick={() => void action("release")}
              >
                <LogOut className="mr-1 inline size-3" aria-hidden />
                Release
              </button>
              {c.ai_mode === "paused" && (
                <button
                  type="button"
                  className="text-[11px] text-primary disabled:opacity-40"
                  disabled={pending || retry}
                  onClick={() => void action("resume")}
                >
                  <Play className="mr-1 inline size-3" aria-hidden />
                  Resume AI
                </button>
              )}
            </div>
          </div>
          <form onSubmit={reply} className="thread-composer">
            <label htmlFor="human-reply" className="sr-only">
              Your human reply
            </label>
            <Textarea
              ref={composer}
              id="human-reply"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Continue the conversation personally…"
              disabled={pending || retry}
              maxLength={2000}
              rows={3}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
              <p
                className={`text-[11px] ${instagram && bytes > 1000 ? "text-red-700" : "text-muted-foreground"}`}
              >
                {instagram
                  ? `${bytes}/1000 bytes · messaging window applies`
                  : `${content.length}/2000 · visible in the visitor’s chat`}
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={
                  pending || !content.trim() || (instagram && bytes > 1000)
                }
              >
                {retry ? <RotateCcw aria-hidden /> : <ArrowUp aria-hidden />}
                {pending
                  ? "Saving…"
                  : retry
                    ? "Retry same reply"
                    : "Send human reply"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="claim-panel">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">
              {other
                ? "A team member is helping this customer."
                : c.ai_mode === "paused"
                  ? "This conversation needs a person."
                  : "Your agent is taking care of this conversation."}
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
              {other
                ? "You can follow along. Only the assignee can send a human reply."
                : "Claim the conversation to reply. Claiming pauses automated answers."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.ai_mode === "paused" && !other && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending || retry}
                onClick={() => void action("resume")}
              >
                <Play aria-hidden />
                Resume AI
              </Button>
            )}
            <Button
              size="sm"
              disabled={pending || other}
              onClick={() => void action("claim")}
            >
              <UserRound aria-hidden />
              {other
                ? "Already claimed"
                : pending
                  ? "Updating…"
                  : "Claim conversation"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
