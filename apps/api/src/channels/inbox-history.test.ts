import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@avenlyo-app/shared";
import { buildApp } from "../app.js";
import { configSchema } from "../config.js";
const workspace = "00000000-0000-4000-8000-000000000001";
const conversation = "00000000-0000-4000-8000-000000000002";
const oldMessage = "00000000-0000-4000-8000-000000000003";
const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
async function setup({ empty = false, failedRead = false } = {}) {
  const deliveries = [
    {
      id: "old-delivery",
      message_id: oldMessage,
      status: "unknown",
      updated_at: "2026-01-01",
    },
  ];
  const selectIds = vi.fn();
  const from = vi.fn((table: string) => {
    const result = {
      data:
        table === "conversations"
          ? { id: conversation, workspace_id: workspace, channel: "instagram" }
          : table === "messages"
            ? empty
              ? []
              : [{ id: oldMessage, created_at: "2026-01-01" }]
            : table === "leads"
              ? null
              : table === "message_deliveries"
                ? deliveries
                : [],
      error:
        table === "message_deliveries" && failedRead
          ? { code: "UNAVAILABLE" }
          : null,
    };
    const chain = {
      select: () => chain,
      eq: () => chain,
      neq: () => chain,
      order: () => chain,
      limit: () => chain,
      in: (column: string, values: string[]) => {
        selectIds(column, values);
        return chain;
      },
      single: async () => result,
      maybeSingle: async () => result,
      then: (resolve: (value: typeof result) => unknown) =>
        Promise.resolve(result).then(resolve),
    };
    return chain;
  });
  const user = {
    auth: {
      getUser: async () => ({ data: { user: { id: workspace } }, error: null }),
    },
    from,
  } as unknown as SupabaseClient<Database>;
  const app = await buildApp({
    config: configSchema.parse({
      SUPABASE_URL: "http://127.0.0.1:55321",
      SUPABASE_PUBLISHABLE_KEY: "fictional-publishable",
    }),
    userClient: () => user,
    logger: false,
  });
  apps.push(app);
  return { app, selectIds, from };
}
async function thread(app: Awaited<ReturnType<typeof buildApp>>) {
  return app.inject({
    method: "POST",
    url: `/v1/inbox/${conversation}/thread`,
    headers: { authorization: "Bearer fictional-token-for-test-only" },
    payload: { workspaceId: workspace },
  });
}
describe("Inbox historical delivery visibility", () => {
  it("reads delivery records for the displayed message page", async () => {
    const { app, selectIds } = await setup();
    const response = await thread(app);
    expect(response.statusCode).toBe(200);
    expect(selectIds).toHaveBeenCalledWith("message_id", [oldMessage]);
    expect(response.json().deliveries[0].status).toBe("unknown");
  });
  it("does not issue an unbounded delivery read for an empty page", async () => {
    const { app, from } = await setup({ empty: true });
    const response = await thread(app);
    expect(response.statusCode).toBe(200);
    expect(response.json().deliveries).toEqual([]);
    expect(from).not.toHaveBeenCalledWith("message_deliveries");
  });
  it("reports failed delivery reads instead of silently hiding their state", async () => {
    const { app } = await setup({ failedRead: true });
    const response = await thread(app);
    expect(response.statusCode).toBe(503);
    expect(response.json().code).toBe("INBOX_UNAVAILABLE");
  });
});
