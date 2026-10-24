"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, UserRound, Play, LogOut, RefreshCw } from "lucide-react";
import { channelLabels, type InboxThread } from "@avenlyo-app/shared";
import { PageHeader } from "./page-header";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { dateLabel } from "@/lib/utils";
import { mergeInboxThread } from "@/lib/inbox-state";
import { ConfirmButton } from "./confirm-button";
export function InboxConversation({
  initial,
  actorId,
}: {
  initial: InboxThread;
  actorId: string;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [liveError, setLiveError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasEarlier, setHasEarlier] = useState(initial.hasEarlier);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retry, setRetry] = useState(false);
  const request = useRef<{ clientMessageId: string; content: string } | null>(
    null,
  );
  const busy = useRef(false);
  const earlierBusy = useRef(false);
  const generation = useRef(0);
  const readSequence = useRef(0);
  const lastRead = useRef(0);
  const thread = useRef<HTMLDivElement>(null);
  const anchor = useRef<{ height: number; top: number } | null>(null);
  const followLatest = useRef(true);
  const id = initial.conversation.id;
  useLayoutEffect(() => {
    const node = thread.current;
    if (!node) return;
    if (anchor.current) {
      node.scrollTop =
        anchor.current.top + node.scrollHeight - anchor.current.height;
      anchor.current = null;
    } else if (followLatest.current) node.scrollTop = node.scrollHeight;
  }, [snapshot.messages]);
  async function refresh(before?: string, signal?: AbortSignal) {
    const version = generation.current;
    const sequence = ++readSequence.current;
    const response = await fetch(
      `/api/inbox/${id}${before ? `?before=${before}` : ""}`,
      { cache: "no-store", signal },
    );
    if (!response.ok) throw new Error("Thread unavailable");
    const next = (await response.json()) as InboxThread;
    if (
      signal?.aborted ||
      version !== generation.current ||
      sequence < lastRead.current
    )
      return;
    lastRead.current = sequence;
    setSnapshot((previous) => mergeInboxThread(previous, next));
    setLiveError("");
    if (before) setHasEarlier(next.hasEarlier);
  }
  useEffect(() => {
    let stopped = false;
    let polling = false;
    const controller = new AbortController();
    const timer = setInterval(async () => {
      if (
        polling ||
        busy.current ||
        earlierBusy.current ||
        earlierBusy.current ||
        document.visibilityState === "hidden"
      )
        return;
      polling = true;
      try {
        await refresh(undefined, controller.signal);
      } catch {
        if (!stopped)
          setLiveError(
            "Live updates are unavailable. Refresh the conversation to check its current state.",
          );
      } finally {
        polling = false;
      }
    }, 4000);
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [id]);
  const c = snapshot.conversation;
  const mine = c.assignee_id === actorId;
  const other = Boolean(c.assignee_id && !mine);
  const instagram = c.channel === "instagram";
  const bytes = new TextEncoder().encode(content.trim()).length;
  async function refreshConfirmed() {
    try {
      await refresh();
    } catch {
      setLiveError(
        "Your action was saved. The latest thread could not be loaded; refresh to check it. Do not resend a confirmed reply.",
      );
    }
  }
  async function action(operation: "claim" | "release" | "resume") {
    if (busy.current || earlierBusy.current || retry) return;
    busy.current = true;
    generation.current++;
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
          ? "AI explicitly resumed for the next customer message."
          : operation === "release"
            ? "Conversation released. AI remains paused."
            : "Conversation claimed. AI remains paused.",
      );
      await refreshConfirmed();
    } catch {
      setError(
        "We could not confirm this change. Refresh the conversation before trying again; another team member may have changed its ownership.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function reply(event: React.FormEvent) {
    event.preventDefault();
    if (
      busy.current ||
      (!request.current &&
        (!mine || !content.trim() || (instagram && bytes > 1000)))
    )
      return;
    request.current ??= {
      clientMessageId: crypto.randomUUID(),
      content: content.trim(),
    };
    const submitted = request.current;
    busy.current = true;
    generation.current++;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/inbox/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "reply", ...submitted }),
      });
      if (!response.ok) {
        if (response.status >= 500 || response.status === 429)
          throw new Error("Unconfirmed reply");
        request.current = null;
        setRetry(false);
        setError(
          response.status === 401
            ? "Your session expired. Sign in again before replying."
            : "Your reply was not accepted. Refresh to check your access and claim, then try again.",
        );
        return;
      }
      const result = (await response.json()) as {
        saved: boolean;
        messageId: string;
        delivery: { status: string };
      };
      if (!result.saved || !result.messageId || !result.delivery)
        throw new Error("Unconfirmed reply");
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
      await refreshConfirmed();
    } catch {
      setRetry(true);
      setError(
        "The reply result is unconfirmed. Retry uses the same message to avoid a duplicate. Check the thread before creating another reply.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function loadEarlier() {
    if (earlierBusy.current || busy.current) return;
    earlierBusy.current = true;
    generation.current++;
    setLoadingEarlier(true);
    followLatest.current = false;
    if (thread.current)
      anchor.current = {
        top: thread.current.scrollTop,
        height: thread.current.scrollHeight,
      };
    try {
      await refresh(snapshot.messages[0]?.id);
    } catch {
      anchor.current = null;
      setLiveError("Earlier messages could not be loaded. Try again.");
    } finally {
      earlierBusy.current = false;
      setLoadingEarlier(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow={channelLabels[c.channel]}
        title={
          snapshot.lead?.name ??
          (instagram ? "Instagram conversation" : "Website conversation")
        }
        description={`Customer channel reference · ${c.external_customer_ref?.slice(0, 32) ?? ""}`}
        action={
          !mine ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending || loadingEarlier || other || retry}
              onClick={() => void action("claim")}
            >
              <UserRound aria-hidden />
              {other ? "Already claimed" : "Claim conversation"}
            </Button>
          ) : undefined
        }
      />
      <div className="mb-5 flex flex-wrap gap-2">
        <Badge
          className={
            c.ai_mode === "paused"
              ? "border-amber-100 bg-amber-50 text-amber-800"
              : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }
        >
          {c.ai_mode === "paused" ? "Needs human · AI paused" : "AI active"}
        </Badge>
        {c.assignee_id && (
          <Badge>{mine ? "Claimed by you" : "Claimed by a team member"}</Badge>
        )}
        {snapshot.lead && (
          <Link
            href={`/app/leads/${snapshot.lead.id}`}
            className="ml-2 pt-1 text-xs font-medium text-primary"
          >
            View linked lead →
          </Link>
        )}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <Card className="min-w-0 overflow-hidden">
          <div
            ref={thread}
            onScroll={(event) => {
              const node = event.currentTarget;
              followLatest.current =
                node.scrollHeight - node.scrollTop - node.clientHeight < 80;
            }}
            className="max-h-[55dvh] min-h-48 space-y-5 overflow-y-auto overscroll-contain p-4 sm:max-h-[580px] sm:p-6"
            role="region"
            tabIndex={0}
            aria-label="Conversation thread"
            aria-busy={loadingEarlier}
          >
            {hasEarlier && (
              <Button
                size="sm"
                variant="ghost"
                disabled={pending || loadingEarlier}
                onClick={() => void loadEarlier()}
              >
                {loadingEarlier
                  ? "Loading earlier messages…"
                  : "Load earlier messages"}
              </Button>
            )}
            {!snapshot.messages.length && (
              <p className="text-sm text-muted-foreground">
                Waiting for the first customer message.
              </p>
            )}
            {snapshot.messages.map((m) => {
              const delivery = snapshot.deliveries.find(
                (d) => d.message_id === m.id,
              );
              return (
                <article
                  key={m.id}
                  className={`max-w-[94%] rounded-xl p-4 ${m.role === "customer" ? "bg-muted/70" : m.role === "human" ? "ml-auto border border-blue-100 bg-blue-50/60" : "ml-auto border border-[#e8e2fc] bg-[#f7f5ff]"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="font-semibold">
                      {m.role === "customer"
                        ? "Customer"
                        : m.role === "human"
                          ? "Team · human reply"
                          : "Avenlyo"}
                    </span>
                    <time dateTime={m.created_at}>
                      {dateLabel(m.created_at)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-7">
                    {m.content}
                  </p>
                  {delivery && (
                    <p
                      className={`mt-3 text-xs ${["unknown", "failed", "blocked"].includes(delivery.status) ? "text-red-700" : "text-muted-foreground"}`}
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
          <form onSubmit={reply} className="border-t border-border p-5 sm:p-6">
            <label htmlFor="human-reply" className="text-sm font-semibold">
              Your human reply
            </label>
            <Textarea
              aria-describedby="human-reply-help"
              id="human-reply"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                mine
                  ? "Continue the conversation personally…"
                  : "Claim this conversation to reply."
              }
              disabled={!mine || pending || retry}
              maxLength={2000}
              rows={3}
              className="mt-3"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p
                id="human-reply-help"
                className="text-xs text-muted-foreground"
              >
                {retry
                  ? "Retry checks the original reply; it does not create another message."
                  : instagram
                    ? `${bytes}/1000 bytes · Instagram reply window applies.`
                    : "Your reply appears in the visitor’s chat."}
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={
                  pending ||
                  (!retry &&
                    (!mine || !content.trim() || (instagram && bytes > 1000)))
                }
              >
                <ArrowUp aria-hidden />
                {pending
                  ? "Saving…"
                  : retry
                    ? "Retry same reply"
                    : "Send human reply"}
              </Button>
            </div>
          </form>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Conversation ownership</h2>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Claiming pauses AI. Human replies and release keep it paused. Resume
            AI explicitly when your team is ready.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {mine && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending || loadingEarlier || retry}
                onClick={() => void action("release")}
              >
                <LogOut aria-hidden />
                Release conversation
              </Button>
            )}
            {c.ai_mode === "paused" && (
              <ConfirmButton
                size="sm"
                disabled={pending || loadingEarlier || other || retry}
                title="Resume AI for this conversation?"
                description="This releases your claim and lets AI answer the next customer message. Saved human replies keep their existing delivery state."
                confirmLabel="Resume AI"
                onConfirm={() => void action("resume")}
              >
                <Play aria-hidden />
                Resume AI
              </ConfirmButton>
            )}
          </div>
          <Button
            className="mt-4 w-full"
            size="sm"
            variant="ghost"
            disabled={pending || refreshing || loadingEarlier}
            onClick={async () => {
              setRefreshing(true);
              try {
                await refresh();
              } catch {
                setLiveError(
                  "The conversation could not be refreshed. Try again when your connection is restored.",
                );
              } finally {
                setRefreshing(false);
              }
            }}
          >
            <RefreshCw aria-hidden />
            {refreshing ? "Refreshing…" : "Refresh conversation"}
          </Button>
          {instagram && (
            <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
              V1 replies must be within 24 hours of the customer’s last
              Instagram message. An expired window is blocked and shown in the
              thread.
            </p>
          )}
          {snapshot.notifications.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="text-xs font-semibold">Staff notifications</h3>
              {snapshot.notifications.map((n) => (
                <p
                  key={n.id}
                  className="mt-3 text-xs leading-5 text-muted-foreground"
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
        </Card>
      </div>
      {liveError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          {liveError}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm leading-6 text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-sm leading-6 text-emerald-700">
          {notice}
        </p>
      )}
    </>
  );
}
