"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, UserRound, Play, LogOut } from "lucide-react";
import {
  channelLabels,
  type InboxThread,
  type InboxItem,
  type Message,
  type Lead,
} from "@avenlyo-app/shared";
import {
  Qualification,
  ChannelLabel,
  ConversationItem,
} from "./conversation-item";
import { Button } from "./ui/button";
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
  contact,
  related,
}: {
  initial: InboxThread;
  actorId: string;
  contact: Lead | null;
  related: InboxItem[];
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
  const thread = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const id = initial.conversation.id;
  useEffect(() => {
    if (thread.current && followLatest.current)
      thread.current.scrollTop = thread.current.scrollHeight;
  }, [snapshot.messages]);
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
      followLatest.current = true;
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
  // Present the selected row from the same existing thread snapshot as the header/context.
  const visibleItems = related.map((item) =>
    item.id !== id
      ? item
      : {
          ...item,
          customerRef:
            snapshot.lead?.name ??
            contact?.company ??
            c.external_customer_ref ??
            item.customerRef,
          aiMode: c.ai_mode,
          handoffState: c.handoff_state,
          assigneeId: c.assignee_id,
          updatedAt: c.updated_at,
          preview: snapshot.messages.at(-1)?.content ?? item.preview,
          qualification: snapshot.lead?.qualification ?? null,
          needsAttention:
            item.needsAttention ||
            snapshot.deliveries.some((d) =>
              ["failed", "unknown", "blocked"].includes(d.status),
            ),
        },
  );
  return (
    <div className="inbox-screen">
      <div className="inbox-workspace">
        <aside className="inbox-navigation" aria-label="Inbox workspace">
          <div className="flex items-center justify-between border-b border-border px-5 py-5">
            <h2 className="text-base font-semibold">Inbox</h2>
            <span className="text-xs text-muted-foreground">
              Customer channels
            </span>
          </div>
          <nav aria-label="Customer conversations">
            {visibleItems.map((item) => (
              <ConversationItem
                key={item.id}
                item={item}
                actorId={actorId}
                selected={item.id === id}
                compact
              />
            ))}
          </nav>
          <Link
            href="/app/inbox"
            className="border-t border-border px-5 py-4 text-xs font-medium text-primary"
          >
            All customer conversations →
          </Link>
        </aside>
        <section className="inbox-center" aria-label="Customer conversation">
          <header className="inbox-conversation-header">
            <Link
              href="/app/inbox"
              className="w-full text-xs text-primary xl:hidden"
            >
              ← All customer conversations
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight">
                {snapshot.lead?.name ??
                  contact?.company ??
                  (instagram
                    ? "Instagram conversation"
                    : "Website conversation")}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <ChannelLabel channel={c.channel} />
                <span className="text-xs text-muted-foreground">
                  Updated {dateLabel(c.updated_at)}
                </span>
              </div>
            </div>
            <div className="space-y-1 sm:text-right">
              <p
                className="status-text"
                data-tone={c.ai_mode === "paused" ? "attention" : "success"}
              >
                {c.ai_mode === "paused"
                  ? "Needs human · AI paused"
                  : "AI active"}
              </p>
              {c.assignee_id && (
                <p className="text-xs text-muted-foreground">
                  {mine ? "Claimed by you" : "Claimed by a team member"}
                </p>
              )}
            </div>
          </header>
          <div
            ref={thread}
            onScroll={(event) => {
              const node = event.currentTarget;
              followLatest.current =
                node.scrollHeight - node.scrollTop - node.clientHeight < 80;
            }}
            className="inbox-thread space-y-7"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
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
            {snapshot.messages.map((m) => {
              const delivery = snapshot.deliveries.find(
                (d) => d.message_id === m.id,
              );
              const deliveryLabel =
                delivery?.status === "available"
                  ? "Available to visitor"
                  : delivery?.status === "sent"
                    ? "Accepted by Instagram"
                    : delivery?.status === "unknown"
                      ? "Delivery unconfirmed · automatic resend stopped"
                      : delivery?.status === "failed"
                        ? "Delivery failed · automatic resend stopped"
                        : delivery?.status === "blocked"
                          ? "Delivery blocked"
                          : "Delivery pending";
              const reason =
                delivery?.error_code === "REPLY_WINDOW_CLOSED"
                  ? "The reply window has ended"
                  : delivery?.error_code === "AI_PAUSED"
                    ? "AI paused before sending"
                    : delivery?.error_code === "CHANNEL_DISCONNECTED"
                      ? "Instagram is disconnected"
                      : delivery?.error_code === "CHANNEL_UNAVAILABLE"
                        ? "The channel is unavailable"
                        : delivery?.error_code === "CREDENTIAL_UNAVAILABLE"
                          ? "The connection needs attention"
                          : "";

              return (
                <article
                  key={m.id}
                  className="conversation-entry"
                  data-role={m.role}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold">
                      {m.role === "customer"
                        ? "Customer"
                        : m.role === "human"
                          ? "Team · human reply"
                          : "Avenlyo"}
                    </span>
                    <time className="conversation-time" dateTime={m.created_at}>
                      {dateLabel(m.created_at)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-6">
                    {m.content}
                  </p>
                  {delivery && (
                    <p
                      className={`mt-2 text-xs leading-5 ${delivery.status === "failed" ? "text-danger" : ["unknown", "blocked"].includes(delivery.status) ? "text-attention" : "text-muted-foreground"}`}
                    >
                      {deliveryLabel}
                      {reason ? ` · ${reason}` : ""}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          <form onSubmit={reply} className="inbox-composer">
            <label htmlFor="human-reply" className="text-xs font-medium">
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
              rows={2}
              className="mt-2 min-h-20 resize-y"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="w-full text-xs text-muted-foreground lg:w-auto">
                {instagram
                  ? `${bytes}/1000 bytes · Instagram reply window applies.`
                  : "Your reply appears in the visitor’s chat."}
              </p>
              {!mine && (
                <Button
                  type="button"
                  size="sm"
                  className="lg:hidden"
                  disabled={pending || other}
                  onClick={() => void action("claim")}
                >
                  <UserRound aria-hidden />
                  {other ? "Already claimed" : "Claim conversation"}
                </Button>
              )}
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
            {error && (
              <p role="alert" className="mt-3 text-xs leading-6 text-danger">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="mt-3 text-xs leading-6 text-success">
                {notice}
              </p>
            )}
          </form>
        </section>
        <aside
          className="inbox-context"
          aria-label="Customer and conversation context"
        >
          <section>
            <h2 className="eyebrow">Customer</h2>
            <p className="mt-3 text-base font-semibold">
              {snapshot.lead?.name ??
                contact?.company ??
                "Contact details in progress"}
            </p>
            {contact ? (
              <dl className="mt-2">
                {[
                  ["Email", contact.email],
                  ["Phone", contact.phone],
                  ["Company", contact.company],
                ].map(([label, value]) => (
                  <div className="context-field" key={label}>
                    <dt>{label}</dt>
                    <dd>{value ?? "Not provided"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                Contact information appears with a linked lead when the customer
                provides it.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Customer-stated information
            </p>
          </section>
          {snapshot.lead && (
            <section>
              <h2 className="eyebrow">Inquiry</h2>
              <div className="mt-3">
                <Qualification value={snapshot.lead.qualification} />
              </div>
              <p className="mt-2 text-[13px]">
                {contact?.intent === "service_inquiry"
                  ? "Service inquiry"
                  : (contact?.intent ?? "Service inquiry")}
              </p>
              {contact?.summary && (
                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-muted-foreground">
                  {contact.summary}
                </p>
              )}
              <Link
                href={`/app/leads/${snapshot.lead.id}`}
                className="mt-4 block text-xs font-medium text-primary hover:underline"
              >
                View linked lead →
              </Link>
            </section>
          )}
          <section>
            <h2 className="eyebrow">Source</h2>
            <p className="mt-3 text-[13px]">{channelLabels[c.channel]}</p>
          </section>
          <section>
            <h2 className="eyebrow">AI & ownership</h2>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">
                {c.ai_mode === "paused" ? "Paused" : "Active"}
              </span>
              <span className="text-xs text-muted-foreground">
                {mine
                  ? "Assigned to you"
                  : other
                    ? "Assigned to a teammate"
                    : "Unassigned"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {c.handoff_state === "requested"
                ? "Human assistance requested. "
                : ""}
              Claiming pauses AI. Replies and release keep it paused until you
              resume it.
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {!mine && (
                <Button
                  size="sm"
                  className="hidden lg:flex"
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
                  variant={mine ? "default" : "outline"}
                  disabled={pending || other || retry}
                  onClick={() => void action("resume")}
                >
                  <Play aria-hidden />
                  Resume AI
                </Button>
              )}
            </div>
            {instagram && (
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                Replies must be within 24 hours of the customer’s last Instagram
                message. Expired replies are blocked.
              </p>
            )}
          </section>
          {snapshot.notifications.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Staff notifications · {snapshot.notifications.length}
              </summary>
              <div className="mt-3 space-y-2">
                {snapshot.notifications.map((n) => (
                  <p
                    key={n.id}
                    className={`text-xs leading-5 ${n.status === "failed" && n.error_code !== "NOTIFICATION_NOT_CONFIGURED" ? "text-danger" : "text-muted-foreground"}`}
                  >
                    {n.kind === "qualified_lead"
                      ? "Qualified inquiry"
                      : "Human assistance"}{" "}
                    ·{" "}
                    {n.status === "sent"
                      ? "email accepted"
                      : n.status === "unknown"
                        ? "delivery unconfirmed"
                        : n.status === "failed" &&
                            n.error_code === "NOTIFICATION_NOT_CONFIGURED"
                          ? "email not configured"
                          : n.status === "failed"
                            ? "email not sent"
                            : n.status === "suppressed"
                              ? "no verified owner recipient"
                              : n.status}
                  </p>
                ))}
              </div>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
