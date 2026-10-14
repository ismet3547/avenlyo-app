"use client";
import { useRef, useState } from "react";
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
        router.replace(`/app/test-agent?conversation=${result.conversationId}`, {
          scroll: false,
        });
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
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
          aria-live="polite"
          aria-busy={pending}
          className="max-h-[560px] min-h-[340px] space-y-5 overflow-y-auto p-5 sm:p-7"
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
                  className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wider ${message.role === "customer" ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {message.role === "customer" ? "Test customer" : "Avenlyo"}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6">
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
            disabled={pending || retry || routeSyncing}
            placeholder="Type a customer question…"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[10px] text-muted-foreground">
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
