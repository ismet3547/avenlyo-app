"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, MessageSquare, RotateCcw, FlaskConical } from "lucide-react";
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
  tone,
  contactFields,
  publishedCount,
}: {
  workspaceId: string;
  conversationId: string | null;
  initialMessages: ChatMessage[];
  initialLeadId: string | null;
  tone: string | null;
  contactFields: string[] | null;
  publishedCount: number | null;
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
  const busy = useRef(false);
  const scroll = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (scroll.current && follow.current)
      scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages, pending]);
  useEffect(() => {
    if (!pending && !routeSyncing && !retry && messages.length)
      field.current?.focus({ preventScroll: true });
  }, [pending, routeSyncing, retry, messages.length]);
  async function send() {
    if (busy.current || routeSyncing) return;
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
    busy.current = true;
    follow.current = true;
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
          result.code === "API_UNAVAILABLE" ||
          result.code === "TURN_PROCESSING";
        setRetry(unknown);
        if (!unknown) request.current = null;
        setError(
          result.code === "AGENT_NOT_CONFIGURED"
            ? "Your agent is not ready for testing yet. Review its setup and try again."
            : unknown
              ? "We could not confirm the result yet. Retry this same message safely."
              : "This turn could not be completed. Please try again in a moment.",
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
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <section className="test-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-muted text-primary">
              <FlaskConical aria-hidden className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Agent preview</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Published knowledge · saved settings
              </p>
            </div>
          </div>
          <Badge>Test mode</Badge>
        </div>
        <div
          ref={scroll}
          onScroll={(event) => {
            const node = event.currentTarget;
            follow.current =
              node.scrollHeight - node.scrollTop - node.clientHeight < 80;
          }}
          role="log"
          aria-label="Test conversation"
          aria-live="polite"
          aria-busy={pending}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7"
        >
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
                onClick={() => {
                  setContent(
                    "I'm interested in a custom project but I'm not sure what I need.",
                  );
                  field.current?.focus();
                }}
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
                className={`max-w-[90%] rounded-lg px-4 py-3 ${message.role === "customer" ? "bg-primary text-white" : "border border-border bg-[#fafafa]"}`}
              >
                <p
                  className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wider ${message.role === "customer" ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {message.role === "customer" ? "Test customer" : "Avenlyo"}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
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
            ref={field}
            id="test-message"
            className="min-h-20 resize-none bg-white shadow-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            disabled={pending || retry || routeSyncing}
            placeholder="Type a customer question…"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              Test conversation · saved in this workspace
            </p>
            <Button
              size="sm"
              type="submit"
              disabled={pending || routeSyncing || !content.trim()}
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
        </form>
      </section>
      <aside className="space-y-6 xl:border-l xl:border-border xl:pl-6">
        <div className="border-b border-border pb-6">
          <h2 className="text-[13px] font-medium">Saved configuration</h2>
          <dl className="mt-5 space-y-4 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Tone</dt>
              <dd className="capitalize">{tone ?? "Unavailable"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Published items</dt>
              <dd>{publishedCount ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contact fields</dt>
              <dd className="mt-1.5 capitalize leading-6">
                {contactFields
                  ? contactFields.join(", ") || "None selected"
                  : "Unavailable"}
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="text-[13px] font-medium">Test result</h2>
          {leadId ? (
            <>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                A test inquiry was created. Further contact details update the
                same inquiry.
              </p>
              <Link
                href={`/app/leads/${leadId}`}
                className="mt-4 block text-xs font-medium"
              >
                View test lead →
              </Link>
            </>
          ) : (
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              No inquiry created yet.
            </p>
          )}
          {id && (
            <Link
              className="mt-4 block text-xs text-muted-foreground hover:text-foreground"
              href={`/app/conversations/${id}`}
            >
              View saved conversation →
            </Link>
          )}
        </div>
        <p className="border-t border-border pt-4 text-[11px] leading-6 text-muted-foreground">
          Test data only. No external customer message or team notification is
          sent.
        </p>
      </aside>
    </div>
  );
}
