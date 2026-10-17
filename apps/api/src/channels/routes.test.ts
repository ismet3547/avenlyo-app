import { afterEach, describe, it, expect, vi } from "vitest";
import { createHmac } from "node:crypto";
import { Writable } from "node:stream";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@avenlyo-app/shared";
import { buildApp } from "../app.js";
import { configSchema } from "../config.js";
const channel = "11111111-1111-4111-8111-111111111111",
  origin = "https://northstar.example",
  credential = "a".repeat(43);
const config = configSchema.parse({
  SUPABASE_URL: "http://127.0.0.1:55321",
  SUPABASE_PUBLISHABLE_KEY: "fake-public",
  SUPABASE_SERVICE_ROLE_KEY: "PRIVATE_BACKEND_KEY_MARKER",
  INSTAGRAM_APP_SECRET: "PRIVATE_APP_SECRET_MARKER",
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "PRIVATE_VERIFY_TOKEN_MARKER",
});
const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((a) => a.close()));
});
async function setup(options: { logs?: string[]; failWebhook?: boolean } = {}) {
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>) => {
    if (name === "website_origin_allowed")
      return {
        data:
          args?.public_channel_id === channel && args.request_origin === origin,
        error: null,
      };
    if (name === "create_website_session")
      return {
        data: { businessName: "Northstar Studio", expiresAt: "2027-01-01" },
        error: null,
      };
    if (name === "accept_instagram_event" && options.failWebhook)
      throw new Error(
        "PRIVATE_BACKEND_KEY_MARKER PRIVATE_CUSTOMER_MESSAGE_MARKER",
      );
    return { data: { received: true }, error: null };
  });
  const stream = options.logs
    ? new Writable({
        write(chunk, _encoding, callback) {
          options.logs!.push(String(chunk));
          callback();
        },
      })
    : undefined;
  const app = await buildApp({
    config,
    serviceClient: { rpc } as unknown as SupabaseClient<Database>,
    logger: Boolean(stream),
    logStream: stream,
    backgroundChannels: false,
  });
  apps.push(app);
  return { app, rpc };
}
describe("public channel ingress", () => {
  it("creates a session only for the mapped exact Origin", async () => {
    const { app, rpc } = await setup();
    const response = await app.inject({
      method: "POST",
      url: `/v1/public/website/${channel}/sessions`,
      headers: { origin },
      payload: {},
    });
    expect(response.statusCode).toBe(201);
    expect(response.headers["access-control-allow-origin"]).toBe(origin);
    expect(response.json().credential).toHaveLength(43);
    const args = rpc.mock.calls.find(
      ([name]) => name === "create_website_session",
    )![1]!;
    expect(args.credential_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(args).not.toHaveProperty("workspaceId");
  });
  it("rejects unknown origins and opaque channels before creating a session", async () => {
    const { app, rpc } = await setup();
    for (const value of [origin + ".evil", "null", "https://other.example"]) {
      const response = await app.inject({
        method: "POST",
        url: `/v1/public/website/${channel}/sessions`,
        headers: { origin: value },
        payload: {},
      });
      expect(response.statusCode).toBe(403);
    }
    expect(
      rpc.mock.calls.some(([name]) => name === "create_website_session"),
    ).toBe(false);
  });
  it("supports bounded authorized preflight without authorizing a session", async () => {
    const { app } = await setup();
    const response = await app.inject({
      method: "OPTIONS",
      url: `/v1/public/website/${channel}/messages`,
      headers: {
        origin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization,content-type",
      },
    });
    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(origin);
    expect(
      response.headers["access-control-allow-credentials"],
    ).toBeUndefined();
  });
  it("rejects forged visitor workspace authority and message roles", async () => {
    const { app, rpc } = await setup();
    const response = await app.inject({
      method: "POST",
      url: `/v1/public/website/${channel}/messages`,
      headers: { origin, authorization: `Bearer ${credential}` },
      payload: {
        clientMessageId: channel,
        content: "Hello",
        workspaceId: channel,
        role: "human",
      },
    });
    expect(response.statusCode).toBe(400);
    expect(rpc.mock.calls.some(([name]) => name === "begin_website_turn")).toBe(
      false,
    );
  });
  it("validates the configured verification token", async () => {
    const { app } = await setup();
    const path =
      "/v1/webhooks/instagram?hub.mode=subscribe&hub.challenge=1234&hub.verify_token=";
    expect(
      (await app.inject(path + config.INSTAGRAM_WEBHOOK_VERIFY_TOKEN)).body,
    ).toBe("1234");
    expect((await app.inject(path + "forged")).statusCode).toBe(403);
  });
  it("rejects invalid signature before attempting JSON processing", async () => {
    const { app, rpc } = await setup();
    const response = await app.inject({
      method: "POST",
      url: "/v1/webhooks/instagram",
      headers: {
        "content-type": "application/json",
        "x-hub-signature-256": "sha256=" + "0".repeat(64),
      },
      payload: '{"malformed private JSON',
    });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ code: "WEBHOOK_SIGNATURE_DENIED" });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("accepts exact signed bytes and uses provider mapping, never payload workspace", async () => {
    const { app, rpc } = await setup();
    const payload = JSON.stringify({
      object: "instagram",
      workspaceId: channel,
      entry: [
        {
          id: "17841400000123456",
          messaging: [
            {
              sender: { id: "987654321" },
              recipient: { id: "17841400000123456" },
              timestamp: Date.now(),
              message: { mid: "mid-a", text: "A question" },
            },
          ],
        },
      ],
    });
    const signature =
      "sha256=" +
      createHmac("sha256", config.INSTAGRAM_APP_SECRET!)
        .update(payload)
        .digest("hex");
    const response = await app.inject({
      method: "POST",
      url: "/v1/webhooks/instagram",
      headers: {
        "content-type": "application/json",
        "x-hub-signature-256": signature,
      },
      payload,
    });
    expect(response.statusCode).toBe(200);
    expect(rpc.mock.calls[0][1]).toMatchObject({
      provider_account_id: "17841400000123456",
      sender_id: "987654321",
    });
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("workspaceId");
  });
  it("rejects oversized webhook bodies without leaking the parser or content", async () => {
    const { app, rpc } = await setup();
    const response = await app.inject({
      method: "POST",
      url: "/v1/webhooks/instagram",
      headers: {
        "content-type": "application/json",
        "x-hub-signature-256": "sha256=" + "0".repeat(64),
      },
      payload: "a".repeat(128001),
    });
    expect(response.statusCode).toBe(413);
    expect(response.json()).toEqual({ code: "PAYLOAD_TOO_LARGE" });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("redacts credentials, verify query and private message even when backend throws", async () => {
    const logs: string[] = [];
    const { app } = await setup({ logs, failWebhook: true });
    const payload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          id: "17841400000123456",
          messaging: [
            {
              sender: { id: "987654321" },
              recipient: { id: "17841400000123456" },
              timestamp: Date.now(),
              message: {
                mid: "mid-private",
                text: "PRIVATE_CUSTOMER_MESSAGE_MARKER",
              },
            },
          ],
        },
      ],
    });
    const signature =
      "sha256=" +
      createHmac("sha256", config.INSTAGRAM_APP_SECRET!)
        .update(payload)
        .digest("hex");
    await app.inject({
      method: "POST",
      url: "/v1/webhooks/instagram",
      headers: {
        "content-type": "application/json",
        "x-hub-signature-256": signature,
        authorization: "Bearer PRIVATE_PROVIDER_TOKEN_MARKER",
      },
      payload,
    });
    await app.inject(
      "/v1/webhooks/instagram?hub.mode=subscribe&hub.challenge=123&hub.verify_token=" +
        config.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
    );
    const output = logs.join("");
    expect(output).toContain("request.failed");
    for (const marker of [
      "PRIVATE_CUSTOMER_MESSAGE_MARKER",
      "PRIVATE_PROVIDER_TOKEN_MARKER",
      config.SUPABASE_SERVICE_ROLE_KEY!,
      config.INSTAGRAM_APP_SECRET!,
      config.INSTAGRAM_WEBHOOK_VERIFY_TOKEN!,
    ])
      expect(output).not.toContain(marker);
  });
});
