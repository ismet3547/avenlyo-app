"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronUp,
  History,
  LoaderCircle,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type {
  InboxItem,
  InboxThread,
  Lead,
  Message,
  TurnResult,
} from "@avenlyo-app/shared";
import {
  Avatar,
  Badge,
  Brand,
  Button,
  ChannelIcon,
  EmptyState,
  Notice,
  Panel,
} from "./ui";
import {
  dateLabel,
  qualificationLabel,
  screenHref,
  timeLabel,
} from "@/lib/presentation";
import { resumeTest } from "@/app/app/test-agent/actions";
const NO_MESSAGES: Message[] = [];
function messageSources(message: Message) {
  if (!Array.isArray(message.sources)) return [];
  return message.sources.flatMap((s) =>
    s &&
    typeof s === "object" &&
    !Array.isArray(s) &&
    typeof s.title === "string"
      ? [s.title]
      : [],
  );
}
export function MessageTimeline({
  messages,
  perspective = "support",
}: {
  messages: Message[];
  perspective?: "support" | "customer";
}) {
  return (
    <>
      {messages.map((message) => (
        <article
          key={message.id}
          className={`message ${(perspective === "customer" ? message.role === "customer" : message.role !== "customer") ? "message-self" : ""} ${message.role === "human" ? "message-human" : ""}`}
        >
          <span className="message-avatar">
            {message.role === "assistant" ? (
              <Sparkles aria-hidden="true" />
            ) : (
              <UserRound aria-hidden="true" />
            )}
          </span>
          <div className="message-body">
            <div className="message-meta">
              <strong>
                {message.role === "customer"
                  ? "Customer"
                  : message.role === "human"
                    ? "Your team"
                    : "Avenlyo"}
              </strong>
              <time dateTime={message.created_at}>
                {timeLabel(message.created_at)} UTC
              </time>
            </div>
            <div className="message-bubble">{message.content}</div>
            {messageSources(message).length > 0 && (
              <div className="message-source">
                <BookOpen
                  aria-hidden="true"
                  style={{ width: 11, height: 11 }}
                />
                {messageSources(message).join(" · ")}
              </div>
            )}
          </div>
        </article>
      ))}
    </>
  );
}
export function InboxView({
  items,
  initialThread,
  userId,
  contact,
  preview = false,
  nextPage,
  previousPage,
}: {
  items: InboxItem[];
  initialThread?: InboxThread;
  userId: string;
  contact?: Lead | null;
  preview?: boolean;
  nextPage?: string;
  previousPage?: string;
}) {
  const [query, setQuery] = useState("");
  const [thread, setThread] = useState(initialThread);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pollError, setPollError] = useState(false);
  const [text, setText] = useState("");
  const [earlier, setEarlier] = useState(false);
  const [replyFailed, setReplyFailed] = useState(false);
  const pendingReply = useRef<{ id: string; content: string } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const id = initialThread?.conversation.id;
  useEffect(() => {
    setThread(initialThread);
    setError("");
    setSuccess("");
    setText("");
    setReplyFailed(false);
    pendingReply.current = null;
  }, [initialThread]);
  useEffect(() => {
    if (!id || preview) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let disposed = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/inbox/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const update = (await response.json()) as InboxThread;
        if (
          !disposed &&
          update.conversation?.id === id &&
          Array.isArray(update.messages)
        ) {
          setThread((current) =>
            current
              ? {
                  ...update,
                  hasEarlier: current.hasEarlier,
                  messages: [
                    ...new Map(
                      [...current.messages, ...update.messages].map((m) => [
                        m.id,
                        m,
                      ]),
                    ).values(),
                  ].sort(
                    (a, b) =>
                      a.created_at.localeCompare(b.created_at) ||
                      a.id.localeCompare(b.id),
                  ),
                }
              : update,
          );
          setPollError(false);
        }
      } catch {
        if (!disposed) setPollError(true);
      } finally {
        if (!disposed) timer = setTimeout(poll, 2000);
      }
    };
    void poll();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, preview]);
  const operation = async (
    op: "claim" | "release" | "resume" | "reply",
    event?: FormEvent,
  ) => {
    event?.preventDefault();
    if (!id || preview || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      let body: object = { operation: op };
      if (op === "reply") {
        if (!text.trim() && !pendingReply.current) return;
        pendingReply.current ??= {
          id: crypto.randomUUID(),
          content: text.trim(),
        };
        body = {
          operation: op,
          clientMessageId: pendingReply.current.id,
          content: pendingReply.current.content,
        };
      }
      const response = await fetch(`/api/inbox/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok)
        throw new Error(
          response.status === 409
            ? "This conversation changed. Refresh its state and try again."
            : "That action could not be completed. Check the connection and try again.",
        );
      if (op === "reply") {
        setText("");
        pendingReply.current = null;
        setReplyFailed(false);
      }
      const fresh = await fetch(`/api/inbox/${id}`, { cache: "no-store" });
      if (!fresh.ok)
        throw new Error(
          "Your action was saved, but the conversation could not be refreshed. Live updates will try again.",
        );
      const value = (await fresh.json()) as InboxThread;
      setThread((current) =>
        current
          ? {
              ...value,
              hasEarlier: current.hasEarlier,
              messages: [
                ...new Map(
                  [...current.messages, ...value.messages].map((m) => [
                    m.id,
                    m,
                  ]),
                ).values(),
              ].sort(
                (a, b) =>
                  a.created_at.localeCompare(b.created_at) ||
                  a.id.localeCompare(b.id),
              ),
            }
          : value,
      );
      setSuccess(
        op === "reply"
          ? "Your reply was saved."
          : op === "claim"
            ? "Conversation assigned to you."
            : op === "release"
              ? "Released. AI remains paused."
              : "Your agent is handling this conversation.",
      );
      if (op === "reply")
        setTimeout(
          () => bottom.current?.scrollIntoView({ block: "nearest" }),
          50,
        );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
      if (op === "reply" && pendingReply.current) setReplyFailed(true);
    } finally {
      setBusy(false);
    }
  };
  const loadEarlier = async () => {
    if (!thread || !id || earlier || preview) return;
    setEarlier(true);
    try {
      const response = await fetch(
        `/api/inbox/${id}?before=${thread.messages[0]?.id}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error();
      const value = (await response.json()) as InboxThread;
      setThread((current) =>
        current
          ? {
              ...current,
              hasEarlier: value.hasEarlier,
              messages: [
                ...new Map(
                  [...value.messages, ...current.messages].map((m) => [
                    m.id,
                    m,
                  ]),
                ).values(),
              ],
            }
          : current,
      );
    } catch {
      setError("Earlier messages could not be loaded. Try again.");
    } finally {
      setEarlier(false);
    }
  };
  const selected = thread?.conversation.id;
  const selectedItem = items.find((i) => i.id === selected);
  const name =
    thread?.lead?.name || selectedItem?.customerRef || "Website visitor";
  const mine = thread?.conversation.assignee_id === userId;
  const unclaimed = !thread?.conversation.assignee_id;
  const canReply = mine && thread?.conversation.ai_mode === "paused";
  const filtered = items
    .map((item) =>
      item.id === selected && thread
        ? {
            ...item,
            aiMode: thread.conversation.ai_mode,
            assigneeId: thread.conversation.assignee_id,
            handoffState: thread.conversation.handoff_state,
            preview: thread.messages.at(-1)?.content ?? item.preview,
            qualification: thread.lead?.qualification ?? item.qualification,
          }
        : item,
    )
    .filter((i) =>
      `${i.customerRef} ${i.preview}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  return (
    <div className={`inbox-workspace ${contact ? "has-contact" : ""}`}>
      <Panel className={`inbox-layout ${thread ? "has-thread" : ""}`}>
        <aside className="inbox-list">
          <div className="inbox-list-heading">
            <h2>
              All conversations{" "}
              <Badge>
                {items.length}
                {nextPage ? "+" : ""}
              </Badge>
            </h2>
            <label className="search-field">
              <span className="sr-only">Search inbox</span>
              <Search aria-hidden="true" />
              <input
                className="input"
                type="search"
                placeholder="Search conversations…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <nav aria-label="Conversations">
            {filtered.map((item) => (
              <Link
                key={item.id}
                className={`inbox-item ${item.id === selected ? "is-selected" : ""}`}
                href={screenHref(`/app/inbox/${item.id}`, preview)}
                aria-current={item.id === selected ? "page" : undefined}
              >
                <div className="row">
                  <Avatar name={item.customerRef || "Visitor"} small />
                  <strong>{item.customerRef || "Website visitor"}</strong>
                  <span className="push-right">
                    <ChannelIcon channel={item.channel} />
                  </span>
                </div>
                <p>{item.preview || "New conversation"}</p>
                {item.assigneeId === userId && (
                  <p className="field-hint">Assigned to you</p>
                )}
                <div className="inbox-item-bottom">
                  <Badge
                    tone={
                      item.aiMode === "paused" || item.needsAttention
                        ? "warning"
                        : "success"
                    }
                    dot
                  >
                    {item.needsAttention
                      ? "Delivery issue"
                      : item.aiMode === "paused"
                        ? "Needs your help"
                        : "AI handling"}
                  </Badge>
                  <time dateTime={item.updatedAt}>
                    {dateLabel(item.updatedAt)}
                  </time>
                </div>
              </Link>
            ))}
          </nav>
          {!filtered.length && (
            <EmptyState
              title="A quieter inbox"
              description={
                items.length
                  ? "No conversations match your search."
                  : "New customer conversations will appear here."
              }
            />
          )}
          <div className="list-footer">
            {previousPage && (
              <Link className="text-link" href={previousPage}>
                Previous
              </Link>
            )}
            {nextPage && (
              <Link className="text-link push-right" href={nextPage}>
                Next page
                <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </div>
        </aside>
        <section className="inbox-thread" aria-label="Conversation thread">
          {thread ? (
            <>
              <div className="thread-header">
                <Link
                  href={screenHref("/app/inbox", preview)}
                  className="icon-button"
                  aria-label="Back to inbox"
                >
                  <ArrowLeft aria-hidden="true" />
                </Link>
                <Avatar name={name} />
                <div>
                  <h2>{name}</h2>
                  <p>
                    {thread.conversation.channel === "instagram"
                      ? "Instagram"
                      : "Website Chat"}{" "}
                    ·{" "}
                    {mine
                      ? "Assigned to you"
                      : unclaimed
                        ? "Unassigned"
                        : "Assigned to a teammate"}
                  </p>
                </div>
                <Badge
                  tone={
                    thread.conversation.ai_mode === "active"
                      ? "success"
                      : "warning"
                  }
                  dot
                >
                  {thread.conversation.ai_mode === "active"
                    ? "AI handling"
                    : "AI paused"}
                </Badge>
              </div>
              <div className="thread-controls">
                <p>
                  {thread.conversation.ai_mode === "active"
                    ? "Your agent is helping this customer."
                    : mine
                      ? "You’re in control of this conversation."
                      : "Claim this conversation to reply personally."}
                </p>
                {!preview && (
                  <>
                    {unclaimed && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => operation("claim")}
                      >
                        Claim conversation
                      </Button>
                    )}
                    {mine && (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => operation("release")}
                      >
                        Release
                      </Button>
                    )}
                    {thread.conversation.ai_mode === "paused" &&
                      (mine || unclaimed) && (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => operation("resume")}
                        >
                          Resume AI
                        </Button>
                      )}
                  </>
                )}
              </div>
              {success && (
                <div className="thread-notice">
                  <Notice>{success}</Notice>
                </div>
              )}
              {(error || pollError) && (
                <div className="thread-notice">
                  <Notice error>
                    {error ||
                      "Live updates are interrupted. Reconnecting automatically…"}
                  </Notice>
                </div>
              )}
              {thread.deliveries.some((d) =>
                ["failed", "unknown", "blocked"].includes(d.status),
              ) && (
                <div className="thread-notice">
                  <Notice error>
                    A message has a delivery issue. Check the channel before
                    sending another message.
                  </Notice>
                </div>
              )}
              <div className="thread-messages" aria-label="Messages">
                {thread.hasEarlier && (
                  <Button
                    variant="ghost"
                    disabled={earlier || preview}
                    onClick={loadEarlier}
                  >
                    <ChevronUp aria-hidden="true" />
                    {earlier ? "Loading…" : "Load earlier messages"}
                  </Button>
                )}
                <p className="thread-date">
                  {dateLabel(thread.conversation.created_at, true)} UTC
                </p>
                <MessageTimeline messages={thread.messages} />
                <div ref={bottom} />
              </div>
              <form
                className="thread-composer"
                onSubmit={(e) => operation("reply", e)}
              >
                <div className="composer-box">
                  <label className="sr-only" htmlFor="human-reply">
                    Reply to customer
                  </label>
                  <textarea
                    id="human-reply"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      preview
                        ? "Design preview · replies are disabled"
                        : canReply
                          ? "Write a thoughtful reply…"
                          : "Claim this conversation to send a reply"
                    }
                    disabled={preview || !canReply || busy || replyFailed}
                    maxLength={2000}
                    required
                  />
                  <div className="composer-bottom">
                    <p>
                      {replyFailed
                        ? "Retry uses the same message to avoid duplicates."
                        : "Personal replies pause the AI until you resume it."}
                    </p>
                    <Button
                      disabled={
                        preview ||
                        !canReply ||
                        busy ||
                        (!text.trim() && !replyFailed)
                      }
                    >
                      {busy ? (
                        <LoaderCircle aria-hidden="true" />
                      ) : (
                        <Send aria-hidden="true" />
                      )}
                      {replyFailed ? "Retry reply" : "Send reply"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <EmptyState
              title="Every conversation has a place"
              description="Choose a conversation on the left to see the full story and lend a hand when it’s needed."
            />
          )}
        </section>
      </Panel>
      {contact && (
        <Panel title="Customer details" className="customer-details">
          <dl className="detail-dl">
            {[
              ["Name", contact.name],
              ["Email", contact.email],
              ["Phone", contact.phone],
              ["Company", contact.company],
              ["Inquiry", contact.summary],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <div className="list-footer">
            <Link
              className="text-link"
              href={screenHref(`/app/leads/${contact.id}`, preview)}
            >
              View lead
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </Panel>
      )}
    </div>
  );
}
export function TestAgent({
  workspaceId,
  initialMessages = NO_MESSAGES,
  conversationId = null,
  paused = false,
  initialLead,
  preview = false,
  published = 0,
}: {
  workspaceId: string;
  initialMessages?: Message[];
  conversationId?: string | null;
  paused?: boolean;
  initialLead?: Lead | null;
  preview?: boolean;
  published?: number | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [id, setId] = useState(conversationId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsHuman, setNeedsHuman] = useState(paused);
  const [leadId, setLeadId] = useState(initialLead?.id ?? null);
  const [sources, setSources] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const request = useRef<{ content: string; key: string } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages(initialMessages);
    setId(conversationId);
    setNeedsHuman(paused);
    setLeadId(initialLead?.id ?? null);
  }, [initialMessages, conversationId, paused, initialLead]);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (preview || busy || needsHuman || (!text.trim() && !request.current))
      return;
    request.current ??= { content: text.trim(), key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          conversationId: id,
          idempotencyKey: request.current.key,
          content: request.current.content,
        }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? "Your agent is busy. Wait a moment and retry."
            : "Your agent could not reply. Check your knowledge and connection, then retry.",
        );
      const data = (await response.json()) as TurnResult;
      if (
        typeof data.conversationId !== "string" ||
        typeof data.reply !== "string" ||
        !Array.isArray(data.sources)
      )
        throw new Error("The reply could not be read. Please retry.");
      const stamp = new Date().toISOString();
      const customer: Message = {
        id: `${request.current.key}-customer`,
        workspace_id: workspaceId,
        conversation_id: data.conversationId,
        role: "customer",
        human_actor_id: null,
        client_message_id: request.current.key,
        content: request.current.content,
        sources: [],
        created_at: stamp,
      };
      const assistant: Message = {
        ...customer,
        id: `${request.current.key}-assistant`,
        role: "assistant",
        client_message_id: null,
        content: data.reply,
        sources: data.sources,
      };
      setMessages((current) => [...current, customer, assistant]);
      setId(data.conversationId);
      setNeedsHuman(data.needsHuman);
      setLeadId(data.leadId);
      setSources(data.sources.map((s) => s.title));
      setText("");
      request.current = null;
      setFailed(false);
      setTimeout(
        () => bottom.current?.scrollIntoView({ block: "nearest" }),
        50,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please retry.");
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="test-layout">
      <Panel className="inbox-thread test-thread">
        <div className="thread-header">
          <span className="message-avatar">
            <Sparkles aria-hidden="true" />
          </span>
          <div>
            <h2>Your AI front office</h2>
            <p>A safe place to see it in action.</p>
          </div>
          <Badge tone="accent">Test mode</Badge>
        </div>
        {messages.length ? (
          <div className="thread-messages">
            <MessageTimeline messages={messages} perspective="customer" />
            {busy && (
              <p className="muted small" role="status">
                Your agent is thinking…
              </p>
            )}
            <div ref={bottom} />
          </div>
        ) : (
          <div className="test-welcome">
            <Brand />
            <h2>Take your agent for a spin.</h2>
            <p>
              Ask a question like a customer would. Your agent will answer using
              your published knowledge.
            </p>
            <div className="prompt-suggestions">
              {[
                "What services do you offer?",
                "How does your pricing work?",
                "Can I speak with your team?",
              ].map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  disabled={preview || busy}
                  onClick={() => setText(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="thread-notice">
            <Notice error>{error}</Notice>
          </div>
        )}
        {needsHuman && (
          <div className="thread-notice">
            <Notice>
              Your agent has requested human assistance. Resume this test when
              you’re ready.
              {id && !preview && (
                <form
                  action={async (form) => {
                    setBusy(true);
                    try {
                      const result = await resumeTest(form);
                      if (result.status === "success") {
                        setNeedsHuman(false);
                        setError("");
                      } else setError(result.message);
                    } catch {
                      setError(
                        "Your test could not be resumed. Please try again.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                  style={{ marginTop: 10 }}
                >
                  <input type="hidden" name="conversationId" value={id} />
                  <Button variant="secondary" disabled={busy}>
                    <RotateCcw aria-hidden="true" />
                    Resume test
                  </Button>
                </form>
              )}
            </Notice>
          </div>
        )}
        <form className="thread-composer" onSubmit={send}>
          <div className="composer-box">
            <label className="sr-only" htmlFor="test-message">
              Message your agent
            </label>
            <textarea
              id="test-message"
              placeholder={
                preview
                  ? "Design preview · test sending is disabled"
                  : "Ask your agent a question…"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              disabled={preview || busy || needsHuman || failed}
              required
            />
            <div className="composer-bottom">
              <p>Test conversations stay separate from customer activity.</p>
              <Button
                disabled={
                  preview || busy || needsHuman || (!text.trim() && !failed)
                }
              >
                {busy ? "Thinking…" : failed ? "Retry message" : "Send message"}
                <Send aria-hidden="true" />
              </Button>
            </div>
          </div>
        </form>
      </Panel>
      <aside className="stack">
        <Panel title="This conversation">
          <dl className="summary-list" style={{ paddingTop: 5 }}>
            <div>
              <dt>Mode</dt>
              <dd>Test only</dd>
            </div>
            <div>
              <dt>Published knowledge</dt>
              <dd>
                {published === null ? "Unavailable" : `${published} items`}
              </dd>
            </div>
            <div>
              <dt>Human assistance</dt>
              <dd>{needsHuman ? "Requested" : "Available"}</dd>
            </div>
            <div>
              <dt>Lead</dt>
              <dd>
                {leadId ? (
                  <Link
                    className="text-link"
                    href={screenHref(`/app/leads/${leadId}`, preview)}
                  >
                    View lead
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ) : (
                  "None yet"
                )}
              </dd>
            </div>
          </dl>
          {sources.length > 0 && (
            <div
              className="panel-body"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <h3>Knowledge used</h3>
              <ul className="small muted">
                {sources.map((source, i) => (
                  <li key={`${source}-${i}`}>{source}</li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
        <Panel className="help-copy">
          <ShieldCheck aria-hidden="true" />
          <h3>A real conversation, without the pressure.</h3>
          <p>
            Try different questions, check the answers and refine your
            knowledge. Test messages never contact customers.
          </p>
          <Link
            className="text-link"
            href={screenHref("/app/knowledge", preview)}
          >
            Review knowledge
            <ArrowRight aria-hidden="true" />
          </Link>
        </Panel>
        <Link
          className="button button-secondary"
          href={screenHref("/app/conversations", preview)}
        >
          <History aria-hidden="true" />
          View test history
        </Link>
        {id && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy || preview}
            onClick={() => {
              setMessages(NO_MESSAGES);
              setId(null);
              setText("");
              setError("");
              setNeedsHuman(false);
              setLeadId(null);
              setSources([]);
              setFailed(false);
              request.current = null;
            }}
          >
            <RotateCcw aria-hidden="true" />
            Start a new test
          </Button>
        )}
        {initialLead && (
          <Notice>
            {qualificationLabel[initialLead.qualification]} ·{" "}
            {initialLead.summary}
          </Notice>
        )}
      </aside>
    </div>
  );
}
