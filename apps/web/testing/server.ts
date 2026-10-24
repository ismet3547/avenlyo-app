// Isolated HTTP fixtures for frontend behavior only. Never imported by the app.
// No real database, provider, email or customer channel is contacted.
import { createServer, type ServerResponse } from "node:http";
import { createHmac } from "node:crypto";
import { fixture, ids, uuid } from "./fixture.ts";
let data = fixture();
let sequence = 5000;
const now = () => new Date().toISOString();
const user = {
  id: ids.actor,
  email: "owner@example.test",
  aud: "authenticated",
  role: "authenticated",
  email_confirmed_at: "2026-10-20T12:00:00Z",
  app_metadata: { provider: "email" },
  user_metadata: {},
  identities: [],
  created_at: "2026-10-20T12:00:00Z",
};
function session() {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      role: "authenticated",
      aud: "authenticated",
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", "fictional-frontend-fixture-key-only")
    .update(`${header}.${payload}`)
    .digest("base64url");
  return {
    access_token: `${header}.${payload}.${signature}`,
    refresh_token: "fictional-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  };
}
function send(res: ServerResponse, body: unknown, status = 200, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, "http://127.0.0.1:55431");
    const path = url.pathname;
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = chunks.length
      ? JSON.parse(Buffer.concat(chunks).toString())
      : {};
    if (path === "/health") return send(res, { fixture: true });
    if (path === "/__fixture/reset") {
      data = fixture();
      return send(res, { reset: true });
    }
    if (path === "/__fixture/control") {
      Object.assign(data.controls, body);
      return send(res, { updated: true });
    }
    if (path === "/__fixture/state")
      return send(res, { ...data, turns: undefined, replies: undefined });
    if (path === "/auth/v1/user") return send(res, user);
    if (path === "/auth/v1/token") return send(res, session());
    if (path === "/auth/v1/signup") return send(res, { user, session: null });
    if (path === "/auth/v1/logout") return send(res, {});
    if (path.startsWith("/rest/v1/rpc/")) {
      const operation = path.split("/").at(-1)!;
      const workspaceId = body.target_workspace_id ?? ids.workspace;
      if (operation === "inbox_snapshot")
        return send(
          res,
          data.conversations
            .filter(
              (c) =>
                c.workspace_id === workspaceId && c.channel !== "test_agent",
            )
            .map((c) => ({
              id: c.id,
              channel: c.channel,
              customerRef: "Alex",
              aiMode: c.ai_mode,
              handoffState: c.handoff_state,
              assigneeId: c.assignee_id,
              updatedAt: c.updated_at,
              preview: "Customer asks for help with a project.",
              leadId: ids.lead,
              qualification: "needs_info",
              needsAttention: c.channel === "instagram",
            })),
        );
      if (
        data.controls.failNextResume &&
        operation === "resume_test_conversation"
      ) {
        data.controls.failNextResume = false;
        return send(
          res,
          { code: "42501", message: "Fixture resume denied" },
          403,
        );
      }
      if (data.controls.failNextSave) {
        data.controls.failNextSave = false;
        return send(
          res,
          { code: "40001", message: "Fixture save conflict" },
          409,
        );
      }
      if (
        data.controls.role !== "owner" &&
        !["resume_test_conversation"].includes(operation)
      )
        return send(res, { code: "42501", message: "Owner required" }, 403);
      data.mutations.push({
        operation,
        workspaceId,
        content: body.business_name ?? body.item_title,
      });
      if (operation === "create_workspace") {
        const id = uuid(++sequence);
        data.workspaces.push({
          ...data.workspaces[0],
          id,
          name: body.business_name,
        });
        data.settings.push({ ...data.settings[0], workspace_id: id });
        return send(res, id);
      }
      if (operation === "rename_workspace")
        data.workspaces.find((w) => w.id === workspaceId)!.name =
          body.business_name;
      if (operation === "save_agent_settings")
        Object.assign(
          data.settings.find((s) => s.workspace_id === workspaceId)!,
          body.settings,
          { updated_at: now() },
        );
      if (operation === "save_knowledge_item") {
        let item = data.knowledge.find(
          (k) => k.id === body.target_item_id && k.workspace_id === workspaceId,
        );
        if (!item) {
          item = {
            ...data.knowledge[0],
            id: uuid(++sequence),
            workspace_id: workspaceId,
          };
          data.knowledge.push(item);
        }
        Object.assign(item, {
          type: body.item_type,
          title: body.item_title,
          content: body.item_content,
          status: "draft",
          revision: item.revision + 1,
          updated_at: now(),
        });
        return send(res, item.id);
      }
      if (operation === "change_knowledge_status")
        data.knowledge.find((k) => k.id === body.target_item_id)!.status =
          body.target_status;
      if (operation === "delete_knowledge_item")
        data.knowledge = data.knowledge.filter(
          (k) => k.id !== body.target_item_id,
        );
      if (operation === "configure_website_channel") {
        const channel = data.channels.find(
          (c) => c.workspace_id === workspaceId && c.channel === "website_chat",
        );
        if (channel)
          Object.assign(channel, {
            enabled: body.channel_enabled,
            approved_origins: body.origins,
          });
      }
      if (operation === "disconnect_instagram_channel")
        Object.assign(
          data.channels.find(
            (c) => c.workspace_id === workspaceId && c.channel === "instagram",
          )!,
          { enabled: false, status: "disconnected" },
        );
      if (operation === "resume_test_conversation")
        Object.assign(
          data.conversations.find((c) => c.id === body.target_conversation_id)!,
          { ai_mode: "active", status: "open" },
        );
      return send(res, null);
    }
    if (path.startsWith("/rest/v1/")) {
      const table = path.split("/").at(-1);
      let rows: Record<string, unknown>[] =
        table === "workspaces"
          ? data.workspaces
          : table === "agent_settings"
            ? data.settings
            : table === "knowledge_items"
              ? data.knowledge
              : table === "conversations"
                ? data.conversations
                : table === "messages"
                  ? data.messages
                  : table === "leads"
                    ? data.leads
                    : table === "channel_connections"
                      ? data.channels
                      : table === "workspace_members"
                        ? data.workspaces.map((w) => ({
                            workspace_id: w.id,
                            user_id: ids.actor,
                            role: data.controls.role,
                            active: true,
                          }))
                        : [];
      for (const [key, value] of url.searchParams) {
        if (value.startsWith("eq."))
          rows = rows.filter((row) => String(row[key]) === value.slice(3));
        if (value.startsWith("neq."))
          rows = rows.filter((row) => String(row[key]) !== value.slice(4));
        if (value.startsWith("ilike."))
          rows = rows.filter((row) =>
            String(row[key])
              .toLowerCase()
              .includes(value.slice(6).replaceAll("%", "").toLowerCase()),
          );
      }
      const order = url.searchParams.get("order")?.split(",") ?? [];
      rows = [...rows].sort((a, b) => {
        for (const term of order) {
          const [key, direction] = term.split(".");
          const compare = String(a[key]).localeCompare(String(b[key]));
          if (compare) return direction === "desc" ? -compare : compare;
        }
        return 0;
      });
      const total = rows.length;
      const offset = Number(url.searchParams.get("offset") ?? 0),
        limit = Number(url.searchParams.get("limit") ?? 1000);
      rows = rows.slice(offset, offset + limit);
      const headers = {
        "Content-Range": `${offset}-${offset + Math.max(0, rows.length - 1)}/${total}`,
      };
      if (req.method === "HEAD") {
        res.writeHead(200, headers);
        return res.end();
      }
      if (req.headers.accept?.includes("application/vnd.pgrst.object+json"))
        return rows.length === 1
          ? send(res, rows[0], 200, headers)
          : send(
              res,
              { code: "PGRST116", details: "0 rows", message: "Unavailable" },
              406,
            );
      return send(res, rows, 200, headers);
    }
    if (/^\/v1\/knowledge\/[^/]+\/publish$/.test(path)) {
      const item = data.knowledge.find(
        (k) =>
          k.id === path.split("/")[3] && k.workspace_id === body.workspaceId,
      );
      if (!item) return send(res, { code: "NOT_FOUND" }, 404);
      item.status = "published";
      return send(res, { status: "published" });
    }
    if (path === "/v1/agent/turn") {
      if (data.turns.has(body.idempotencyKey))
        return send(res, data.turns.get(body.idempotencyKey));
      const id = body.conversationId ?? uuid(++sequence);
      let conversation = data.conversations.find((c) => c.id === id);
      if (!conversation) {
        conversation = { ...data.conversations[0], id };
        data.conversations.push(conversation);
      }
      const needsHuman = /human/i.test(body.content);
      if (needsHuman)
        Object.assign(conversation, {
          ai_mode: "paused",
          status: "needs_human",
          state_version: conversation.state_version + 1,
        });
      const reply = needsHuman
        ? "A person can help. Automated answers are paused."
        : "We design logos and websites. How can we help with your project?";
      for (const [role, content] of [
        ["customer", body.content],
        ["assistant", reply],
      ] as const)
        data.messages.push({
          ...data.messages[0],
          id: uuid(++sequence),
          conversation_id: id,
          role,
          content,
          created_at: now(),
        });
      const result = {
        conversationId: id,
        reply,
        leadId: null,
        needsHuman,
        sources: [],
        replayed: false,
      };
      data.turns.set(body.idempotencyKey, result);
      return send(res, result);
    }
    if (path.startsWith("/v1/inbox/")) {
      const id = path.split("/")[3],
        conversation = data.conversations.find((c) => c.id === id)!;
      if (path.endsWith("/thread")) {
        if (data.controls.failNextThread) {
          data.controls.failNextThread = false;
          return send(res, { code: "FIXTURE_UNAVAILABLE" }, 503);
        }
        let messages = data.messages.filter((m) => m.conversation_id === id);
        if (body.beforeMessageId)
          messages = messages.slice(
            0,
            messages.findIndex((m) => m.id === body.beforeMessageId),
          );
        return send(res, {
          conversation,
          messages: messages.slice(-100),
          lead:
            id === ids.inbox
              ? { id: ids.lead, name: "Alex", qualification: "needs_info" }
              : null,
          deliveries: data.deliveries,
          notifications: [],
          hasEarlier: messages.length > 100,
        });
      }
      if (path.endsWith("/action")) {
        const action = body.action;
        Object.assign(conversation, {
          assignee_id: action === "claim" ? ids.actor : null,
          ai_mode: action === "resume" ? "active" : "paused",
          status: action === "resume" ? "open" : "needs_human",
          handoff_state: action === "claim" ? "claimed" : "requested",
          state_version: conversation.state_version + 1,
          updated_at: now(),
        });
        data.mutations.push({
          operation: action,
          workspaceId: body.workspaceId,
        });
        return send(res, { saved: true });
      }
      if (path.endsWith("/reply")) {
        let id = data.replies.get(body.clientMessageId);
        if (!id) {
          if (conversation.assignee_id !== ids.actor)
            return send(res, { code: "INBOX_ACCESS_DENIED" }, 403);
          id = uuid(++sequence);
          data.replies.set(body.clientMessageId, id);
          data.messages.push({
            ...data.messages[0],
            id,
            conversation_id: conversation.id,
            role: "human",
            content: body.content,
            client_message_id: body.clientMessageId,
            created_at: now(),
          });
          data.deliveries.push({
            id: uuid(++sequence),
            message_id: id,
            workspace_id: ids.workspace,
            conversation_id: conversation.id,
            connection_id: uuid(400),
            status:
              conversation.channel === "instagram" ? "unknown" : "available",
            provider_message_id: null,
            error_code: null,
            claimed_at: null,
            created_at: now(),
            updated_at: now(),
          });
        }
        return send(res, {
          saved: true,
          messageId: id,
          delivery: {
            status:
              conversation.channel === "instagram" ? "unknown" : "available",
          },
        });
      }
    }
    return send(res, { code: "UNEXPECTED_FIXTURE_REQUEST", path }, 404);
  } catch (error) {
    console.error(error);
    send(res, { code: "FIXTURE_ERROR" }, 500);
  }
});
server.listen(55431, "127.0.0.1", () =>
  console.log("Frontend fixtures listening on loopback:55431"),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => server.close());
