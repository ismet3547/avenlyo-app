"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Check,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { TurnResult } from "@avenlyo-app/shared";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
type ChatMessage = { role: "customer" | "assistant"; content: string };
type RequestInput = {
  workspaceId: string;
  conversationId: string | null;
  content: string;
  idempotencyKey: string;
};
export function TestChat({
  workspaceId,
  conversationId,
  initialMessages,
  initialLeadId,
  paused = false,
  partialHistory = false,
}: {
  workspaceId: string;
  conversationId: string | null;
  initialMessages: ChatMessage[];
  initialLeadId: string | null;
  paused?: boolean;
  partialHistory?: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [id, setId] = useState(conversationId);
  const [leadId, setLeadId] = useState(initialLeadId);
  const [pending, setPending] = useState(false);
  const [routeSyncing, setRouteSyncing] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(false);
  const request = useRef<RequestInput | null>(null);
  const sending = useRef(false);
  const thread = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  useEffect(() => {
    if (thread.current && followLatest.current)
      thread.current.scrollTop = thread.current.scrollHeight;
  }, [messages, pending]);
  async function send() {
    if (sending.current || routeSyncing || (paused && !retry)) return;
    if (!request.current) {
      if (!content.trim()) return;
      request.current = {
        workspaceId,
        conversationId: id,
        content: content.trim(),
        idempotencyKey: crypto.randomUUID(),
      };
    }
    const submitted = request.current;
    if (!submitted) return;
    sending.current = true;
    followLatest.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitted),
      });
      const result = (await response.json()) as TurnResult & { code?: string };
      if (!response.ok) {
        const unknown =
          response.status >= 500 || result.code === "TURN_PROCESSING";
        setRetry(unknown);
        if (!unknown) request.current = null;
        setError(
          result.code === "AGENT_NOT_CONFIGURED"
            ? "The agent is not available yet. Ask your workspace administrator to check its configuration."
            : response.status === 401
              ? "Your session expired. Sign in again to continue your saved tests."
              : response.status === 429
                ? "Too many messages were sent. Wait a moment, then try again."
                : unknown
                  ? "We could not confirm the result yet. Retry this same message safely."
                  : "This message could not be completed. Review the saved conversation before trying again.",
        );
        return;
      }
      setMessages((previous) => [
        ...previous,
        { role: "customer", content: submitted.content },
        { role: "assistant", content: result.reply },
      ]);
      setId(result.conversationId);
      setLeadId(result.leadId);
      setContent("");
      setRetry(false);
      request.current = null;
      if (submitted.conversationId === null) {
        // The first successful turn gives this test its durable conversation URL.
        // Keep the composer locked until the server page remounts with that ID;
        // otherwise a fast second input can be lost during router.replace().
        setRouteSyncing(true);
        router.replace(
          `/app/test-agent?conversation=${result.conversationId}`,
          {
            scroll: false,
          },
        );
      } else if (result.needsHuman) {
        // Refresh server-owned handoff state so the paused banner/action appear.
        router.refresh();
      }
    } catch {
      setRetry(true);
      setError(
        "Connection interrupted. Retry the same message to check its result.",
      );
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-[#efeffd] text-primary">
              <Sparkles aria-hidden className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Your Avenlyo agent</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Published knowledge · effective settings
              </p>
            </div>
          </div>
          <Badge>Test mode</Badge>
        </div>
        <div
          ref={thread}
          role="log"
          aria-label="Test conversation messages"
          onScroll={(event) => {
            const node = event.currentTarget;
            followLatest.current =
              node.scrollHeight - node.scrollTop - node.clientHeight < 80;
          }}
          aria-busy={pending}
          className="max-h-[55dvh] min-h-[260px] space-y-5 overflow-y-auto overscroll-contain p-4 sm:max-h-[560px] sm:min-h-[340px] sm:p-7"
        >
          {partialHistory && id && (
            <p className="text-xs leading-5 text-muted-foreground">
              Showing the latest 100 messages.{" "}
              <Link
                className="text-primary underline"
                href={`/app/conversations/${id}`}
              >
                Read earlier messages
              </Link>
            </p>
          )}
          {!messages.length && (
            <div className="mx-auto max-w-sm py-10 text-center">
              <MessageSquare
                aria-hidden
                className="mx-auto size-7 text-primary"
              />
              <h3 className="mt-4 font-semibold">Ask like a customer</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try a question about your services or a genuine project inquiry.
                You’ll see how your agent uses your published knowledge.
              </p>
              <button
                type="button"
                className="mt-6 rounded-lg border border-border bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground hover:border-primary"
                onClick={() =>
                  setContent(
                    "I'm interested in a custom project but I'm not sure what I need.",
                  )
                }
              >
                “I’m interested in a custom project…”
              </button>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              className={`flex ${message.role === "customer" ? "justify-end" : "justify-start"}`}
              key={index}
            >
              <div
                className={`max-w-[90%] rounded-xl px-4 py-3 ${message.role === "customer" ? "bg-primary text-white" : "border border-border bg-[#fafafe]"}`}
              >
                <p
                  className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${message.role === "customer" ? "text-white" : "text-muted-foreground"}`}
                >
                  {message.role === "customer" ? "Test customer" : "Avenlyo"}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {(pending || routeSyncing) && (
            <p role="status" className="text-xs text-muted-foreground">
              {pending
                ? "Avenlyo is preparing an answer…"
                : "Opening the saved conversation…"}
            </p>
          )}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className="border-t border-border p-4"
        >
          <label htmlFor="test-message" className="sr-only">
            Customer message
          </label>
          <Textarea
            id="test-message"
            className="min-h-20 resize-none border-0 bg-muted shadow-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            disabled={pending || retry || routeSyncing || paused}
            placeholder={
              paused
                ? "Resume test AI above to continue."
                : "Type a customer question…"
            }
            aria-describedby="test-message-help"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p
              id="test-message-help"
              className="text-xs leading-5 text-muted-foreground"
            >
              {paused
                ? "AI paused · resume above to continue"
                : "Test only · saved in this workspace"}
            </p>
            <Button
              size="sm"
              type="submit"
              disabled={
                pending ||
                routeSyncing ||
                (!retry && (paused || !content.trim()))
              }
            >
              {retry ? <RotateCcw aria-hidden /> : <ArrowUp aria-hidden />}
              {retry
                ? "Retry same message"
                : pending
                  ? "Working…"
                  : routeSyncing
                    ? "Opening…"
                    : "Send"}
            </Button>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700"
            >
              {error}
            </p>
          )}
          {error && (
            <Link
              href={id ? `/app/conversations/${id}` : "/app/conversations"}
              className="mt-3 inline-block text-sm text-primary underline"
            >
              Check saved conversations
            </Link>
          )}
        </form>
      </section>
      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold">What to look for</h2>
          <div className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
            {[
              "Answers grounded in published information",
              "A useful follow-up for genuine interest",
              "Only customer-stated contact details",
              "Human assistance when needed",
            ].map((text) => (
              <p key={text} className="flex gap-2">
                <Check
                  aria-hidden
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                />
                {text}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-[#f2f2fd] p-5">
          <h2 className="text-sm font-semibold">Conversation outcome</h2>
          {leadId ? (
            <>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                One lead is linked to this test conversation. Further contact
                details update the same lead.
              </p>
              <Link
                href={`/app/leads/${leadId}`}
                className="mt-4 block text-xs font-medium text-primary"
              >
                View test lead →
              </Link>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              No lead yet. Genuine service interest and relevant contact details
              are required.
            </p>
          )}
          {id && (
            <Link
              className="mt-4 block text-xs text-primary"
              href={`/app/conversations/${id}`}
            >
              View saved conversation →
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
