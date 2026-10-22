import { describe, it, expect, vi } from "vitest";
import { configSchema } from "../config.js";
import { provisioningTarget, verifyManagedInstagram } from "./provision.js";
const config = configSchema.parse({
  SUPABASE_URL: "http://127.0.0.1:55321",
  SUPABASE_SERVICE_ROLE_KEY: "fake-backend-key",
  INSTAGRAM_META_APP_ID: "123456789",
  INSTAGRAM_APP_SECRET: "fictional-app-secret",
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "fictional-verify-token-long",
  INSTAGRAM_WEBHOOK_URL: "https://api.example.test/v1/webhooks/instagram",
});
const args = [
  "--workspace",
  "11111111-1111-4111-8111-111111111111",
  "--target",
  "local",
  "--confirm-workspace-name",
  "Northstar Studio",
  "--account",
  "17841400000123456",
  "--username",
  "northstar",
  "--token-file",
  "/explicit/private-token",
  "--dry-run",
];
describe("managed provisioning guard", () => {
  it("accepts an explicit workspace Agent without weakening provider acknowledgements", () => {
    const agent = "22222222-2222-4222-8222-222222222222";
    expect(provisioningTarget([...args, "--agent", agent], config).agent).toBe(
      agent,
    );
    expect(() =>
      provisioningTarget([...args, "--agent", "invalid"], config),
    ).toThrow("EXPLICIT_PROVISIONING_ARGUMENTS_REQUIRED");
  });
  it("requires explicit project and workspace acknowledgements", () => {
    expect(provisioningTarget(args, config).target).toBe("local");
    expect(() => provisioningTarget([], config)).toThrow();
    expect(() =>
      provisioningTarget(args, {
        ...config,
        SUPABASE_URL: "https://other.example",
      }),
    ).toThrow("PROJECT_TARGET_MISMATCH");
  });
  it("requires a matching production flag even for a hosted dry run", () => {
    const target = "abcdefghijklmnopqrst";
    const hostedArgs = args.map((v) => (v === "local" ? target : v));
    const hosted = { ...config, SUPABASE_URL: `https://${target}.supabase.co` };
    expect(() => provisioningTarget(hostedArgs, hosted)).toThrow(
      "PRODUCTION_ACKNOWLEDGEMENT_REQUIRED",
    );
    expect(
      provisioningTarget(
        [...hostedArgs, "--confirm-production", target],
        hosted,
      ).target,
    ).toBe(target);
  });
  it("verifies account, app callback and account subscription without writes in dry run", async () => {
    const request = vi.fn<typeof fetch>(async (url) => {
      const u = new URL(String(url));
      if (u.pathname.endsWith("/me"))
        return Response.json({
          user_id: "17841400000123456",
          username: "northstar",
          account_type: "BUSINESS",
        });
      if (u.pathname.endsWith("/subscriptions"))
        return Response.json({
          data: [
            {
              object: "instagram",
              callback_url: config.INSTAGRAM_WEBHOOK_URL,
              active: true,
              fields: [{ name: "messages", version: "v26.0" }],
            },
          ],
        });
      if (u.pathname.endsWith("/subscribed_apps"))
        return Response.json({ data: [] });
      return new Response(u.searchParams.get("hub.challenge")!);
    });
    const result = await verifyManagedInstagram(
      {
        accountId: "17841400000123456",
        username: "northstar",
        token: "fake-secret-token",
        config,
        dryRun: true,
      },
      request,
    );
    expect(result.willSubscribe).toBe(true);
    expect(JSON.stringify(result)).not.toContain("fake-secret-token");
    expect(
      request.mock.calls.every(
        ([, init]) => !init?.method || init.method === "GET",
      ),
    ).toBe(true);
  });
  it("refuses a wrong professional account before provisioning writes", async () => {
    const request = vi.fn<typeof fetch>(async () =>
      Response.json({
        user_id: "different",
        username: "northstar",
        account_type: "BUSINESS",
      }),
    );
    await expect(
      verifyManagedInstagram(
        {
          accountId: "17841400000123456",
          username: "northstar",
          token: "fake",
          config,
          dryRun: false,
        },
        request,
      ),
    ).rejects.toThrow("PROFESSIONAL_ACCOUNT_MISMATCH");
    expect(request).toHaveBeenCalledTimes(1);
  });
});
