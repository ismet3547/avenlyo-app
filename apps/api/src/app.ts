import Fastify, { type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { turnSchema, type Database } from "@avenlyo-app/shared";
import { z } from "zod";
import type { Writable } from "node:stream";
declare module "fastify" {
  interface FastifyInstance {
    processChannelWork(): Promise<void>;
  }
}
import type { Config } from "./config.js";
import { FrontOfficeRuntime, RuntimeError } from "./runtime/agent.js";
import { OpenAIProvider, type AgentProvider } from "./runtime/provider.js";
import { ChannelWork } from "./channels/work.js";
import { registerChannelRoutes } from "./channels/routes.js";
import {
  MetaInstagramTransport,
  ResendBusinessEmailProvider,
  type InstagramTransport,
  type BusinessEmailProvider,
} from "./channels/transports.js";

export interface AppInput {
  config: Config;
  provider?: AgentProvider;
  userClient?: (token: string) => SupabaseClient<Database>;
  serviceClient?: SupabaseClient<Database>;
  logger?: boolean;
  logStream?: Writable;
  instagramTransport?: InstagramTransport;
  emailProvider?: BusinessEmailProvider;
  backgroundChannels?: boolean;
}
export async function buildApp(input: AppInput) {
  const { config } = input;
  const app = Fastify({
    bodyLimit: 32000,
    logger:
      input.logger === false
        ? false
        : {
            stream: input.logStream,
            redact: [
              "req.headers.authorization",
              "req.headers.cookie",
              "res.headers.set-cookie",
            ],
            serializers: {
              req: (req) => ({
                method: req.method,
                route: req.url?.split("?")[0],
              }),
            },
          },
  });
  app.setErrorHandler((error, request, reply) => {
    const known = error instanceof RuntimeError;
    const frameworkStatus =
      error instanceof Error && "statusCode" in error ? error.statusCode : null;
    const status = known
      ? error.status
      : frameworkStatus === 429
        ? 429
        : frameworkStatus === 413
          ? 413
          : frameworkStatus === 400
            ? 400
            : 503;
    const code = known
      ? error.code
      : status === 429
        ? "RATE_LIMITED"
        : status === 413
          ? "PAYLOAD_TOO_LARGE"
          : status === 400
            ? "INVALID_REQUEST"
            : "SERVICE_UNAVAILABLE";
    request.log.warn(
      { event: "request.failed", code },
      "Request could not be completed",
    );
    reply.code(status).send({ code });
  });
  await app.register(cors, {
    origin: config.API_CORS_ORIGIN,
    credentials: false,
    preflight: false,
  });
  await app.register(rateLimit, { max: 90, timeWindow: "1 minute" });
  const configured = Boolean(
    config.SUPABASE_URL &&
      config.SUPABASE_PUBLISHABLE_KEY &&
      config.SUPABASE_SERVICE_ROLE_KEY,
  );
  const service =
    input.serviceClient ??
    (configured
      ? createClient<Database>(
          config.SUPABASE_URL!,
          config.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        )
      : null);
  const provider =
    input.provider ??
    (config.OPENAI_API_KEY
      ? new OpenAIProvider(
          config.OPENAI_API_KEY,
          config.OPENAI_AGENT_MODEL,
          config.OPENAI_EMBEDDING_MODEL,
        )
      : null);
  const runtime =
    service && provider ? new FrontOfficeRuntime(service, provider) : null;
  const work = service
    ? new ChannelWork(
        service,
        runtime,
        input.instagramTransport ?? new MetaInstagramTransport(),
        input.emailProvider ??
          (config.BUSINESS_NOTIFICATION_PROVIDER === "resend" &&
          config.RESEND_API_KEY &&
          config.BUSINESS_NOTIFICATION_FROM
            ? new ResendBusinessEmailProvider(config.RESEND_API_KEY)
            : null),
        config,
        (event, code) => app.log.info({ event, code }),
      )
    : null;
  if (work && (input.backgroundChannels ?? input.logger !== false)) {
    app.addHook("onReady", async () => {
      work.start();
    });
    app.addHook("onClose", async () => {
      await work.stop();
    });
  }
  async function authenticate(request: FastifyRequest) {
    const header = request.headers.authorization;
    if (!header || !/^Bearer [A-Za-z0-9._~-]{20,4096}$/.test(header))
      throw new RuntimeError("UNAUTHORIZED", 401);
    if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY)
      throw new RuntimeError("BACKEND_NOT_CONFIGURED", 503);
    const token = header.slice(7);
    const user =
      input.userClient?.(token) ??
      createClient<Database>(
        config.SUPABASE_URL,
        config.SUPABASE_PUBLISHABLE_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        },
      );
    const verified = await user.auth.getUser(token);
    if (verified.error || !verified.data.user)
      throw new RuntimeError("UNAUTHORIZED", 401);
    return { user, actorId: verified.data.user.id };
  }
  app.get("/health", { config: { rateLimit: false } }, async () => ({
    status: "ok",
    agentConfigured: Boolean(runtime),
  }));
  app.post(
    "/v1/agent/turn",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request) => {
      const { user, actorId } = await authenticate(request);
      const parsed = turnSchema.safeParse(request.body);
      if (!parsed.success) throw new RuntimeError("INVALID_TURN");
      if (!runtime) throw new RuntimeError("AGENT_NOT_CONFIGURED", 503);
      return runtime.turn(actorId, user, parsed.data);
    },
  );
  app.post(
    "/v1/knowledge/:id/publish",
    { config: { rateLimit: { max: 15, timeWindow: "1 minute" } } },
    async (request) => {
      const { user, actorId } = await authenticate(request);
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      const body = z
        .object({ workspaceId: z.uuid() })
        .strict()
        .safeParse(request.body);
      if (!params.success || !body.success)
        throw new RuntimeError("INVALID_KNOWLEDGE");
      if (!service || !provider)
        throw new RuntimeError("AGENT_NOT_CONFIGURED", 503);
      // RLS and current role are checked before any provider request; the protected final RPC checks again.
      const member = await user
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", body.data.workspaceId)
        .eq("user_id", actorId)
        .eq("active", true)
        .single();
      if (member.error || member.data.role !== "owner")
        throw new RuntimeError("FORBIDDEN", 403);
      const item = await user
        .from("knowledge_items")
        .select("*")
        .eq("id", params.data.id)
        .eq("workspace_id", body.data.workspaceId)
        .single();
      if (item.error) throw new RuntimeError("NOT_FOUND", 404);
      const embedding = await provider.embed(
        `${item.data.title}\n${item.data.runtime_content ?? item.data.content}`,
      );
      const published = await service.rpc("publish_knowledge_item", {
        actor_id: actorId,
        target_workspace_id: body.data.workspaceId,
        target_item_id: params.data.id,
        expected_revision: item.data.revision,
        item_embedding: JSON.stringify(embedding),
      });
      if (published.error) throw new RuntimeError("KNOWLEDGE_CHANGED", 409);
      return { status: "published" };
    },
  );
  await registerChannelRoutes(app, {
    config,
    service,
    runtime,
    work,
    authenticate,
  });
  return Object.assign(app, {
    processChannelWork: () => work?.pump() ?? Promise.resolve(),
  });
}
