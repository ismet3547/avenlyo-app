"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, MessageSquare, RotateCcw } from "lucide-react";
import type { TurnResult } from "@avenlyo-app/shared";
import { Button } from "./ui/button";
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
}: {
  workspaceId: string;
  conversationId: string | null;
  initialMessages: ChatMessage[];
  initialLeadId: string | null;
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
  async function send() {
    if (pending) return;
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
            ? "Test Agent needs the local API, Supabase and OpenAI configuration."
            : unknown
              ? "We could not confirm the result yet. Retry this same message safely."
              : "This turn could not be completed. Check the API setup, then try a new message.",
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
      setPending(false);
    }
  }
  return (
    <div className="test-workspace">
      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold">Your Avenlyo agent</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Published knowledge · saved settings
            </p>
          </div>
          <span className="text-xs text-muted-foreground">Internal test</span>
        </div>
        <div
          aria-live="polite"
          aria-busy={pending}
          className="test-timeline space-y-7"
        >
          {!messages.length && (
            <div className="mx-auto max-w-sm py-8 text-center">
              <MessageSquare
                aria-hidden
                className="mx-auto size-6 text-primary"
              />
              <h3 className="mt-4 font-medium">Ask like a customer</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try a question about your services or a genuine project inquiry.
                See how your agent uses your published knowledge.
              </p>
              <button
                type="button"
                className="mt-5 border-b border-border py-2 text-xs font-medium text-primary hover:border-primary"
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
            <article
              className="conversation-entry"
              data-role={message.role}
              key={index}
            >
              <p className="mb-2 text-xs font-semibold">
                {message.role === "customer" ? "Test customer" : "Avenlyo"}
              </p>
              <p className="whitespace-pre-wrap text-[13px] leading-6">
                {message.content}
              </p>
            </article>
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
          className="border-t border-border p-4 sm:px-6"
        >
          <label htmlFor="test-message" className="sr-only">
            Customer message
          </label>
          <Textarea
            id="test-message"
            className="min-h-20 resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            disabled={pending || retry || routeSyncing}
            placeholder="Type a customer question…"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Saved in this workspace
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
              className="mt-3 rounded-md bg-danger-soft p-3 text-xs leading-5 text-danger"
            >
              {error}
            </p>
          )}
        </form>
      </section>
      <aside className="border-t border-border pt-5 lg:border-t-0 lg:pt-0">
        <h2 className="text-sm font-semibold">Conversation outcome</h2>
        {leadId ? (
          <>
            <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
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
          <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
            No lead yet. Genuine service interest and relevant contact details
            are required.
          </p>
        )}
        {id && (
          <Link
            className="mt-4 block text-xs font-medium text-primary"
            href={`/app/conversations/${id}`}
          >
            View saved conversation →
          </Link>
        )}
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            Refine what your agent can use.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-primary">
            <Link href="/app/agent">Agent settings</Link>
            <Link href="/app/knowledge">Business knowledge</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
