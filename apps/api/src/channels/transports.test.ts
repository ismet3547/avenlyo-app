import { describe, it, expect, vi } from "vitest";
import {
  MetaInstagramTransport,
  ResendBusinessEmailProvider,
} from "./transports.js";
const message = {
  deliveryId: "11111111-1111-4111-8111-111111111111",
  accountId: "17841400000123456",
  recipientId: "123456789",
  accessToken: "fictional-secret-token",
  apiVersion: "v26.0",
  text: "Grounded answer",
};
describe("single-attempt external transport", () => {
  it("uses the audited Instagram Login endpoint and bounded payload", async () => {
    const request = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ message_id: "mid-sent" }), {
          status: 200,
        }),
    );
    expect(await new MetaInstagramTransport(request).send(message)).toEqual({
      state: "sent",
      providerMessageId: "mid-sent",
    });
    expect(request).toHaveBeenCalledTimes(1);
    const [url, init] = request.mock.calls[0];
    expect(url).toBe(
      "https://graph.instagram.com/v26.0/17841400000123456/messages",
    );
    expect(String(url)).not.toContain(message.accessToken);
    expect(JSON.parse(String(init?.body))).toEqual({
      recipient: { id: message.recipientId },
      message: { text: message.text },
    });
  });
  it.each(["network", "server", "invalid_success"])(
    "does not blindly retry ambiguous %s",
    async (kind) => {
      const request = vi.fn<typeof fetch>(async () => {
        if (kind === "network") throw new Error("Timeout with private token");
        return new Response(kind === "server" ? '{"error":{}}' : "{}", {
          status: kind === "server" ? 502 : 200,
        });
      });
      expect(
        (await new MetaInstagramTransport(request).send(message)).state,
      ).toBe("unknown");
      expect(request).toHaveBeenCalledTimes(1);
    },
  );
  it("records a definitive Meta rejection without exposing its private body", async () => {
    const request = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            error: { code: 190, message: message.accessToken },
          }),
          { status: 400 },
        ),
    );
    const outcome = await new MetaInstagramTransport(request).send(message);
    expect(outcome).toEqual({ state: "failed", code: "META_REJECTED_190" });
    expect(JSON.stringify(outcome)).not.toContain(message.accessToken);
  });
  it("never sends oversized multibyte text or an unreviewed API version", async () => {
    const request = vi.fn<typeof fetch>();
    const transport = new MetaInstagramTransport(request);
    expect(
      (await transport.send({ ...message, text: "🟣".repeat(300) })).state,
    ).toBe("failed");
    expect(
      (await transport.send({ ...message, apiVersion: "v99.0" })).state,
    ).toBe("failed");
    expect(request).not.toHaveBeenCalled();
  });
  it("adds a durable Resend idempotency key and sends internal plain text only", async () => {
    const request = vi.fn<typeof fetch>(
      async () => new Response('{"id":"email-one"}', { status: 200 }),
    );
    const provider = new ResendBusinessEmailProvider(
      "fictional-resend-secret",
      request,
    );
    expect(
      (
        await provider.send({
          notificationId: message.deliveryId,
          to: "owner@example.test",
          from: "Avenlyo <team@example.test>",
          subject: "New inquiry",
          text: "Open Inbox",
        })
      ).state,
    ).toBe("sent");
    const init = request.mock.calls[0][1]!;
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe(
      `avenlyo-notification-${message.deliveryId}`,
    );
    expect(JSON.parse(String(init.body))).toEqual({
      from: "Avenlyo <team@example.test>",
      to: ["owner@example.test"],
      subject: "New inquiry",
      text: "Open Inbox",
    });
  });
  it("does not retry an ambiguous email outcome", async () => {
    const request = vi.fn<typeof fetch>(async () => {
      throw new Error("Private provider failure");
    });
    const result = await new ResendBusinessEmailProvider("fake", request).send({
      notificationId: message.deliveryId,
      to: "owner@example.test",
      from: "team@example.test",
      subject: "Handoff",
      text: "Open Inbox",
    });
    expect(result).toEqual({ state: "unknown", code: "EMAIL_OUTCOME_UNKNOWN" });
    expect(request).toHaveBeenCalledTimes(1);
  });
});
