"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, UserRound, Play, LogOut } from "lucide-react";
import {
  channelLabels,
  type InboxThread,
  type Message,
} from "@avenlyo-app/shared";
import { PageHeader } from "./page-header";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { dateLabel } from "@/lib/utils";
function mergeMessages(current: Message[], incoming: Message[]) {
  return [
    ...new Map([...current, ...incoming].map((m) => [m.id, m])).values(),
  ].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}
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
  const [notice, setNotice] = useState("");
  const [hasEarlier, setHasEarlier] = useState(initial.hasEarlier);
  const [retry, setRetry] = useState(false);
  const request = useRef<{ clientMessageId: string; content: string } | null>(
    null,
  );
  const id = initial.conversation.id;
  async function refresh(before?: string) {
    const response = await fetch(
      `/api/inbox/${id}${before ? `?before=${before}` : ""}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error("Thread unavailable");
    const next = (await response.json()) as InboxThread;
    setSnapshot((prev) => ({
      ...next,
      messages: mergeMessages(prev.messages, next.messages),
    }));
    if (before) setHasEarlier(next.hasEarlier);
  }
  useEffect(() => {
    let stopped = false;
    let busy = false;
    const timer = setInterval(async () => {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const response = await fetch(`/api/inbox/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Thread unavailable");
        const next = (await response.json()) as InboxThread;
        if (!stopped)
          setSnapshot((prev) => ({
            ...next,
            messages: mergeMessages(prev.messages, next.messages),
          }));
      } catch {
        if (!stopped)
          setError(
            "Live updates are unavailable. Reload to check the latest conversation state.",
          );
      } finally {
        busy = false;
      }
    }, 4000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [id]);
  const c = snapshot.conversation;
  const mine = c.assignee_id === actorId;
  const other = Boolean(c.assignee_id && !mine);
  const instagram = c.channel === "instagram";
  const bytes = new TextEncoder().encode(content.trim()).length;
  async function action(operation: "claim" | "release" | "resume") {
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
      await refresh();
      setNotice(
        operation === "resume"
          ? "AI explicitly resumed for the next customer message."
          : operation === "release"
            ? "Conversation released. AI remains paused."
            : "Conversation claimed. AI remains paused.",
      );
    } catch {
      setError(
        "Could not update this conversation. It may have been claimed by another team member. Reload to check its state.",
      );
    } finally {
      setPending(false);
    }
  }
  async function reply(event: React.FormEvent) {
    event.preventDefault();
    if (!request.current)
      request.current = {
        clientMessageId: crypto.randomUUID(),
        content: content.trim(),
      };
    const submitted = request.current;
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
      await refresh();
    } catch {
      setRetry(true);
      setError(
        "The reply result is unconfirmed. Retry uses the same message to avoid a duplicate. Check the thread before creating another reply.",
      );
    } finally {
      setPending(false);
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
            className="max-h-[580px] space-y-5 overflow-y-auto p-5 sm:p-6"
            aria-label="Conversation thread"
          >
            {hasEarlier && (
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={async () => {
                  try {
                    await refresh(snapshot.messages[0]?.id);
                  } catch {
                    setError("Earlier messages could not be loaded.");
                  }
                }}
              >
                Load earlier messages
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
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground">
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
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">
                    {m.content}
                  </p>
                  {delivery && (
                    <p
                      className={`mt-3 text-[10px] ${["unknown", "failed", "blocked"].includes(delivery.status) ? "text-red-700" : "text-muted-foreground"}`}
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
              <p className="text-xs text-muted-foreground">
                {instagram
                  ? `${bytes}/1000 bytes · Instagram reply window applies.`
                  : "Your reply appears in the visitor’s chat."}
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !mine ||
                  pending ||
                  !content.trim() ||
                  (instagram && bytes > 1000)
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
            {!mine && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending || other}
                onClick={() => void action("claim")}
              >
                <UserRound aria-hidden />
                {other ? "Already claimed" : "Claim conversation"}
              </Button>
            )}
            {mine && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => void action("release")}
              >
                <LogOut aria-hidden />
                Release conversation
              </Button>
            )}
            {c.ai_mode === "paused" && (
              <Button
                size="sm"
                disabled={pending || other || retry}
                onClick={() => void action("resume")}
              >
                <Play aria-hidden />
                Resume AI
              </Button>
            )}
          </div>
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
