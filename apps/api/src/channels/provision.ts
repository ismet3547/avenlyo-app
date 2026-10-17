import { parseArgs } from "node:util";
import { z } from "zod";
import type { Config } from "../config.js";

export class ProvisionError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
export function provisioningTarget(args: string[], config: Config) {
  const parsed = parseArgs({
    args,
    strict: true,
    allowPositionals: false,
    options: {
      workspace: { type: "string" },
      target: { type: "string" },
      "confirm-production": { type: "string" },
      "confirm-workspace-name": { type: "string" },
      account: { type: "string" },
      username: { type: "string" },
      "token-file": { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  }).values;
  const values = z
    .object({
      workspace: z.uuid(),
      target: z.string().regex(/^(local|[a-z0-9]{20})$/),
      "confirm-workspace-name": z.string().min(2).max(100),
      account: z.string().regex(/^\d{3,32}$/),
      username: z.string().regex(/^[A-Za-z0-9._]{1,30}$/),
      "token-file": z.string().min(1),
      "confirm-production": z.string().optional(),
      "dry-run": z.boolean(),
    })
    .safeParse(parsed);
  if (!values.success)
    throw new ProvisionError("EXPLICIT_PROVISIONING_ARGUMENTS_REQUIRED");
  const v = values.data;
  const expected =
    v.target === "local"
      ? "http://127.0.0.1:55321"
      : `https://${v.target}.supabase.co`;
  if (config.SUPABASE_URL !== expected || !config.SUPABASE_SERVICE_ROLE_KEY)
    throw new ProvisionError("PROJECT_TARGET_MISMATCH");
  if (v.target !== "local" && v["confirm-production"] !== v.target)
    throw new ProvisionError("PRODUCTION_ACKNOWLEDGEMENT_REQUIRED");
  if (
    !config.INSTAGRAM_META_APP_ID ||
    !config.INSTAGRAM_APP_SECRET ||
    !config.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ||
    !config.INSTAGRAM_WEBHOOK_URL
  )
    throw new ProvisionError("INSTAGRAM_OPERATOR_ENVIRONMENT_REQUIRED");
  const webhook = new URL(config.INSTAGRAM_WEBHOOK_URL);
  if (
    webhook.protocol !== "https:" ||
    webhook.username ||
    webhook.password ||
    webhook.pathname !== "/v1/webhooks/instagram" ||
    webhook.search ||
    webhook.hash
  )
    throw new ProvisionError("EXACT_HTTPS_WEBHOOK_URL_REQUIRED");
  return v;
}
export async function verifyManagedInstagram(
  input: {
    accountId: string;
    username: string;
    token: string;
    config: Config;
    dryRun: boolean;
  },
  request: typeof fetch = fetch,
) {
  const { config, token } = input;
  const graph = `https://graph.instagram.com/${config.INSTAGRAM_API_VERSION}`;
  async function api(
    url: string,
    credential: string,
    options: RequestInit = {},
  ) {
    let response: Response;
    try {
      response = await request(url, {
        ...options,
        redirect: "error",
        signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${credential}`, ...options.headers },
      });
    } catch {
      throw new ProvisionError("META_VERIFICATION_UNAVAILABLE");
    }
    if (!response.ok) throw new ProvisionError("META_VERIFICATION_REJECTED");
    try {
      return (await response.json()) as unknown;
    } catch {
      throw new ProvisionError("META_VERIFICATION_INVALID");
    }
  }
  const profile = z
    .object({
      user_id: z.string(),
      username: z.string(),
      account_type: z.string(),
    })
    .safeParse(
      await api(`${graph}/me?fields=user_id,username,account_type`, token),
    );
  if (
    !profile.success ||
    profile.data.user_id !== input.accountId ||
    profile.data.username.toLowerCase() !== input.username.toLowerCase() ||
    !["BUSINESS", "MEDIA_CREATOR"].includes(
      profile.data.account_type.toUpperCase(),
    )
  )
    throw new ProvisionError("PROFESSIONAL_ACCOUNT_MISMATCH");
  const subscriptions = z.object({
    data: z.array(
      z.object({
        object: z.string(),
        callback_url: z.string(),
        active: z.boolean(),
        fields: z.array(
          z.object({ name: z.string(), version: z.string().optional() }),
        ),
      }),
    ),
  });
  const app = subscriptions.safeParse(
    await api(
      `https://graph.facebook.com/${config.INSTAGRAM_API_VERSION}/${config.INSTAGRAM_META_APP_ID}/subscriptions`,
      `${config.INSTAGRAM_META_APP_ID}|${config.INSTAGRAM_APP_SECRET}`,
    ),
  );
  if (
    !app.success ||
    !app.data.data.some(
      (s) =>
        s.object === "instagram" &&
        s.active &&
        s.callback_url === config.INSTAGRAM_WEBHOOK_URL &&
        s.fields.some(
          (f) =>
            f.name === "messages" &&
            (!f.version || f.version === config.INSTAGRAM_API_VERSION),
        ),
    )
  )
    throw new ProvisionError("APP_MESSAGES_WEBHOOK_NOT_VERIFIED");
  const challenge = String(Date.now());
  const callback = new URL(config.INSTAGRAM_WEBHOOK_URL!);
  callback.searchParams.set("hub.mode", "subscribe");
  callback.searchParams.set(
    "hub.verify_token",
    config.INSTAGRAM_WEBHOOK_VERIFY_TOKEN!,
  );
  callback.searchParams.set("hub.challenge", challenge);
  let verified = false;
  try {
    const response = await request(callback, {
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    verified = response.ok && (await response.text()) === challenge;
  } catch {
    /* Safe bounded failure below; raw network errors may contain secret URLs. */
  }
  if (!verified) throw new ProvisionError("APPLICATION_WEBHOOK_NOT_VERIFIED");
  const installed = z.object({
    data: z.array(
      z.object({ id: z.string(), subscribed_fields: z.array(z.string()) }),
    ),
  });
  async function subscribed() {
    const result = installed.safeParse(
      await api(`${graph}/${input.accountId}/subscribed_apps`, token),
    );
    return (
      result.success &&
      result.data.data.some(
        (a) =>
          a.id === config.INSTAGRAM_META_APP_ID &&
          a.subscribed_fields.includes("messages"),
      )
    );
  }
  const already = await subscribed();
  if (!already && !input.dryRun) {
    await api(`${graph}/${input.accountId}/subscribed_apps`, token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ subscribed_fields: "messages" }).toString(),
    });
    if (!(await subscribed()))
      throw new ProvisionError("ACCOUNT_MESSAGES_SUBSCRIPTION_NOT_VERIFIED");
  }
  return {
    accountId: profile.data.user_id,
    username: profile.data.username,
    accountType: profile.data.account_type,
    apiVersion: config.INSTAGRAM_API_VERSION,
    appId: config.INSTAGRAM_META_APP_ID!,
    willSubscribe: !already,
  };
}
