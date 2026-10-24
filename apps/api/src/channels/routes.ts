import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  websiteMessageSchema,
  websiteOriginSchema,
  humanReplySchema,
  type Database,
} from "@avenlyo-app/shared";
import { z } from "zod";
import type { Config } from "../config.js";
import { FrontOfficeRuntime, RuntimeError } from "../runtime/agent.js";
import {
  credentialHash,
  newVisitorCredential,
  normalizeInstagram,
  safeEqual,
  validMetaSignature,
  visitorCredential,
} from "./security.js";
import type { ChannelWork } from "./work.js";
import { widgetScript } from "./widget.js";

export async function registerChannelRoutes(
  app: FastifyInstance,
  input: {
    config: Config;
    service: SupabaseClient<Database> | null;
    runtime: FrontOfficeRuntime | null;
    work: ChannelWork | null;
    authenticate: (
      request: FastifyRequest,
    ) => Promise<{ user: SupabaseClient<Database>; actorId: string }>;
  },
) {
  const { service, runtime, config, work } = input;
  function backend() {
    if (!service) throw new RuntimeError("BACKEND_NOT_CONFIGURED", 503);
    return service;
  }
  const contexts = new WeakMap<
    FastifyRequest,
    { channel: string; origin: string }
  >();
  async function websiteOrigin(request: FastifyRequest, reply: FastifyReply) {
    reply.header("Cache-Control", "private, no-store");
    const params = z.object({ channel: z.uuid() }).safeParse(request.params);
    const origin = websiteOriginSchema.safeParse(request.headers.origin);
    if (!params.success || !origin.success)
      throw new RuntimeError("WEBSITE_ORIGIN_DENIED", 403);
    const allowed = await backend().rpc("website_origin_allowed", {
      public_channel_id: params.data.channel,
      request_origin: origin.data,
    });
    if (allowed.error) throw new RuntimeError("CHANNEL_UNAVAILABLE", 503);
    if (!allowed.data) throw new RuntimeError("WEBSITE_ORIGIN_DENIED", 403);
    contexts.set(request, {
      channel: params.data.channel,
      origin: origin.data,
    });
    reply
      .header("Access-Control-Allow-Origin", origin.data)
      .header("Vary", "Origin");
  }
  function visitor(request: FastifyRequest) {
    const context = contexts.get(request)!;
    const credential = visitorCredential(request.headers.authorization);
    if (!credential) throw new RuntimeError("VISITOR_SESSION_DENIED", 403);
    return {
      public_channel_id: context.channel,
      request_origin: context.origin,
      credential_hash: credentialHash(credential),
    };
  }
  const prefix = "/v1/public/website/:channel";
  for (const suffix of ["sessions", "messages", "thread"]) {
    app.options(
      `${prefix}/${suffix}`,
      { onRequest: websiteOrigin },
      async (_request, reply) => {
        return reply
          .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .header("Access-Control-Allow-Headers", "Authorization, Content-Type")
          .header("Access-Control-Max-Age", "300")
          .code(204)
          .send();
      },
    );
  }
  app.get(
    "/widget.js",
    { config: { rateLimit: false } },
    async (_request, reply) =>
      reply
        .type("application/javascript; charset=utf-8")
        .header("Cache-Control", "public, max-age=300")
        .header("Cross-Origin-Resource-Policy", "cross-origin")
        .header("X-Content-Type-Options", "nosniff")
        .send(widgetScript),
  );
  app.post(
    `${prefix}/sessions`,
    {
      onRequest: websiteOrigin,
      bodyLimit: 1000,
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      if (!z.object({}).strict().safeParse(request.body).success)
        throw new RuntimeError("INVALID_SESSION_REQUEST");
      const context = contexts.get(request)!;
      const credential = newVisitorCredential();
      const session = await backend().rpc("create_website_session", {
        public_channel_id: context.channel,
        request_origin: context.origin,
        credential_hash: credentialHash(credential),
      });
      if (session.error) throw new RuntimeError("VISITOR_SESSION_DENIED", 403);
      return reply.code(201).send({ ...(session.data as object), credential });
    },
  );
  app.get(
    `${prefix}/thread`,
    {
      onRequest: websiteOrigin,
      config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    },
    async (request) => {
      const query = z
        .object({ before: z.uuid().optional() })
        .strict()
        .safeParse(request.query);
      if (!query.success) throw new RuntimeError("INVALID_THREAD_REQUEST");
      const thread = await backend().rpc("read_website_thread", {
        ...visitor(request),
        before_message_id: query.data.before ?? null,
      });
      if (thread.error) throw new RuntimeError("VISITOR_SESSION_DENIED", 403);
      return thread.data;
    },
  );
  app.post(
    `${prefix}/messages`,
    {
      onRequest: websiteOrigin,
      bodyLimit: 9000,
      config: { rateLimit: { max: 25, timeWindow: "1 minute" } },
    },
    async (request) => {
      const parsed = websiteMessageSchema.safeParse(request.body);
      if (!parsed.success) throw new RuntimeError("INVALID_WEBSITE_MESSAGE");
      const started = await backend().rpc("begin_website_turn", {
        ...visitor(request),
        client_message_id: parsed.data.clientMessageId,
        customer_content: parsed.data.content,
      });
      if (started.error)
        throw new RuntimeError(
          started.error.code === "42501"
            ? "VISITOR_SESSION_DENIED"
            : started.error.code === "P0001"
              ? "RATE_LIMITED"
              : "TURN_CONFLICT",
          started.error.code === "42501"
            ? 403
            : started.error.code === "P0001"
              ? 429
              : 409,
        );
      const run = started.data?.[0];
      if (!run) throw new RuntimeError("TURN_UNAVAILABLE", 503);
      if (!runtime) {
        await backend().rpc("fail_channel_turn", { target_run_id: run.run_id });
        await work?.notifyConversation(run.conversation_id);
        throw new RuntimeError("MESSAGE_SAVED_NEEDS_HUMAN", 503);
      }
      try {
        const result = await runtime.channelTurn(run);
        await work?.notifyConversation(run.conversation_id);
        return {
          accepted: true,
          needsHuman: result.needsHuman,
          replayed: result.replayed,
        };
      } catch (error) {
        await work?.notifyConversation(run.conversation_id);
        throw error;
      }
    },
  );

  app.register(async (webhook) => {
    webhook.addContentTypeParser(
      "application/json",
      { parseAs: "buffer" },
      (_request, body, done) => done(null, body),
    );
    webhook.get("/v1/webhooks/instagram", async (request, reply) => {
      const query = z
        .object({
          "hub.mode": z.literal("subscribe"),
          "hub.verify_token": z.string().max(200),
          "hub.challenge": z.string().regex(/^\d{1,200}$/),
        })
        .strict()
        .safeParse(request.query);
      if (
        !query.success ||
        !config.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ||
        !safeEqual(
          query.data["hub.verify_token"],
          config.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
        )
      )
        throw new RuntimeError("WEBHOOK_VERIFICATION_DENIED", 403);
      return reply
        .type("text/plain")
        .header("Cache-Control", "no-store")
        .send(query.data["hub.challenge"]);
    });
    webhook.post(
      "/v1/webhooks/instagram",
      {
        bodyLimit: 128000,
        config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
      },
      async (request) => {
        const signature = request.headers["x-hub-signature-256"];
        if (
          !Buffer.isBuffer(request.body) ||
          typeof signature !== "string" ||
          !config.INSTAGRAM_APP_SECRET ||
          !validMetaSignature(
            request.body,
            signature,
            config.INSTAGRAM_APP_SECRET,
          )
        )
          throw new RuntimeError("WEBHOOK_SIGNATURE_DENIED", 403);
        let json: unknown;
        try {
          json = JSON.parse(request.body.toString("utf8"));
        } catch {
          throw new RuntimeError("INVALID_WEBHOOK_JSON");
        }
        for (const event of normalizeInstagram(json)) {
          const saved = await backend().rpc("accept_instagram_event", {
            provider_account_id: event.accountId,
            sender_id: event.senderId,
            provider_message_id: event.messageId,
            customer_content: event.content,
            payload_hash: event.payloadHash,
            provider_timestamp: event.timestamp,
          });
          // A conflicting replay is rejected without storing new evidence; provider retries need no new work.
          if (saved.error && saved.error.code !== "22023")
            throw new RuntimeError("WEBHOOK_STORAGE_UNAVAILABLE", 503);
          if (saved.error)
            request.log.warn({
              event: "webhook.replay.conflict",
              code: "PROVIDER_REPLAY_CONFLICT",
            });
        }
        return { received: true };
      },
    );
  });

  app.post("/v1/inbox/:id/thread", async (request) => {
    const { user } = await input.authenticate(request);
    const params = z.object({ id: z.uuid() }).safeParse(request.params);
    const body = z
      .object({
        workspaceId: z.uuid(),
        beforeMessageId: z.uuid().nullable().optional(),
      })
      .strict()
      .safeParse(request.body);
    if (!params.success || !body.success)
      throw new RuntimeError("INVALID_INBOX_REQUEST");
    const conversation = await user
      .from("conversations")
      .select("*")
      .eq("workspace_id", body.data.workspaceId)
      .eq("id", params.data.id)
      .neq("channel", "test_agent")
      .single();
    if (conversation.error) throw new RuntimeError("INBOX_ACCESS_DENIED", 403);
    let messageQuery = user
      .from("messages")
      .select("*")
      .eq("workspace_id", body.data.workspaceId)
      .eq("conversation_id", params.data.id);
    if (body.data.beforeMessageId) {
      const boundary = await user
        .from("messages")
        .select("id,created_at")
        .eq("workspace_id", body.data.workspaceId)
        .eq("conversation_id", params.data.id)
        .eq("id", body.data.beforeMessageId)
        .single();
      if (boundary.error) throw new RuntimeError("INBOX_ACCESS_DENIED", 403);
      messageQuery = messageQuery.or(
        `created_at.lt.${boundary.data.created_at},and(created_at.eq.${boundary.data.created_at},id.lt.${boundary.data.id})`,
      );
    }
    const [messages, lead, notifications] = await Promise.all([
      messageQuery
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(100),
      user
        .from("leads")
        .select("id,name,qualification")
        .eq("workspace_id", body.data.workspaceId)
        .eq("conversation_id", params.data.id)
        .maybeSingle(),
      user
        .from("business_notifications")
        .select("id,kind,status,error_code")
        .eq("workspace_id", body.data.workspaceId)
        .eq("conversation_id", params.data.id),
    ]);
    if (messages.error || lead.error || notifications.error)
      throw new RuntimeError("INBOX_UNAVAILABLE", 503);
    // Delivery truth must follow the requested message page, including history.
    // Retain both tenant and conversation scopes; no delivery is retried here.
    const deliveries = messages.data.length
      ? await user
          .from("message_deliveries")
          .select("*")
          .eq("workspace_id", body.data.workspaceId)
          .eq("conversation_id", params.data.id)
          .in(
            "message_id",
            messages.data.map((message) => message.id),
          )
      : { data: [], error: null };
    if (deliveries.error) throw new RuntimeError("INBOX_UNAVAILABLE", 503);
    return {
      conversation: conversation.data,
      messages: [...messages.data].reverse(),
      lead: lead.data,
      deliveries: deliveries.data,
      notifications: notifications.data,
      hasEarlier: messages.data.length === 100,
    };
  });
  app.post("/v1/inbox/:id/action", async (request) => {
    const { user } = await input.authenticate(request);
    const params = z.object({ id: z.uuid() }).safeParse(request.params);
    const body = z
      .object({
        workspaceId: z.uuid(),
        action: z.enum(["claim", "release", "resume"]),
      })
      .strict()
      .safeParse(request.body);
    if (!params.success || !body.success)
      throw new RuntimeError("INVALID_TEAM_ACTION");
    const result = await user.rpc("conversation_team_action", {
      target_workspace_id: body.data.workspaceId,
      target_conversation_id: params.data.id,
      team_action: body.data.action,
    });
    if (result.error)
      throw new RuntimeError(
        result.error.code === "42501"
          ? "INBOX_ACCESS_DENIED"
          : "CLAIM_CONFLICT",
        result.error.code === "42501" ? 403 : 409,
      );
    return { saved: true };
  });
  app.post(
    "/v1/inbox/:id/reply",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request) => {
      const { user } = await input.authenticate(request);
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      const body = humanReplySchema.safeParse(request.body);
      if (!params.success || !body.success)
        throw new RuntimeError("INVALID_HUMAN_REPLY");
      const stored = await user.rpc("create_human_reply", {
        target_workspace_id: body.data.workspaceId,
        target_conversation_id: params.data.id,
        client_message_id: body.data.clientMessageId,
        reply_content: body.data.content,
      });
      if (stored.error)
        throw new RuntimeError(
          stored.error.code === "42501"
            ? "INBOX_ACCESS_DENIED"
            : "HUMAN_REPLY_CONFLICT",
          stored.error.code === "42501" ? 403 : 409,
        );
      try {
        await work?.deliverMessage(stored.data);
      } catch {
        request.log.warn({
          event: "delivery.queued",
          code: "DELIVERY_UNAVAILABLE",
        });
      }
      const delivery = await user
        .from("message_deliveries")
        .select("status,error_code")
        .eq("message_id", stored.data)
        .eq("workspace_id", body.data.workspaceId)
        .single();
      return {
        saved: true,
        messageId: stored.data,
        delivery: delivery.data ?? { status: "pending", error_code: null },
      };
    },
  );
}
