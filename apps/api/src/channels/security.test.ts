import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  websiteConfigurationSchema,
  websiteMessageSchema,
} from "@avenlyo-app/shared";
import {
  boundedInstagramText,
  credentialHash,
  newVisitorCredential,
  normalizeInstagram,
  validMetaSignature,
  visitorCredential,
} from "./security.js";
const secret = "fictional-app-secret-for-unit-tests";
describe("channel authority boundaries", () => {
  it("generates independent 256-bit visitor credentials and stores one-way hashes", () => {
    const a = newVisitorCredential(),
      b = newVisitorCredential();
    expect(a).toHaveLength(43);
    expect(a).not.toBe(b);
    expect(credentialHash(a)).toMatch(/^[a-f0-9]{64}$/);
    expect(credentialHash(a)).not.toContain(a);
    expect(visitorCredential(`Bearer ${a}`)).toBe(a);
    expect(visitorCredential(`Bearer ${a} `)).toBeNull();
  });
  it.each([
    "https://example.com",
    "https://www.example.com",
    "https://example.com:8443",
    "http://localhost:3001",
    "http://127.0.0.1:8000",
  ])("accepts exact origin %s", (origin) => {
    expect(
      websiteConfigurationSchema.safeParse({ enabled: true, origins: [origin] })
        .success,
    ).toBe(true);
  });
  it.each([
    "*",
    "https://*.example.com",
    "https://example.com/",
    "https://example.com/path",
    "https://example.com?x=1",
    "https://user:password@example.com",
    "http://example.com",
    "https://EXAMPLE.com",
  ])("rejects broad/noncanonical origin %s", (origin) => {
    expect(
      websiteConfigurationSchema.safeParse({ enabled: true, origins: [origin] })
        .success,
    ).toBe(false);
  });
  it("does not accept a visitor workspace, message role or arbitrary recipient", () => {
    const message = {
      clientMessageId: "11111111-1111-4111-8111-111111111111",
      content: "Hi",
    };
    for (const extra of [
      { workspaceId: "22222222-2222-4222-8222-222222222222" },
      { role: "human" },
      { recipient: "evil@example.test" },
    ])
      expect(
        websiteMessageSchema.safeParse({ ...message, ...extra }).success,
      ).toBe(false);
  });
  it("checks exact signed bytes, including whitespace, and rejects wrong or malformed signatures", () => {
    const raw = Buffer.from('{ "object": "instagram" }');
    const sig =
      "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
    expect(validMetaSignature(raw, sig, secret)).toBe(true);
    expect(
      validMetaSignature(Buffer.from('{"object":"instagram"}'), sig, secret),
    ).toBe(false);
    expect(validMetaSignature(raw, sig, "another-secret")).toBe(false);
    for (const bad of [
      undefined,
      "sha1=abc",
      "sha256=ab",
      "sha256=" + "x".repeat(64),
    ])
      expect(validMetaSignature(raw, bad, secret)).toBe(false);
  });
  it("normalizes text only and never uses payload workspace identity", () => {
    const now = Date.now(),
      account = "17841400000123456";
    const event = {
      sender: { id: "123456789" },
      recipient: { id: account },
      timestamp: now,
      message: { mid: "mid-one", text: "Hello" },
    };
    const value = {
      object: "instagram",
      workspaceId: "forged",
      entry: [
        {
          id: account,
          workspaceId: "forged",
          messaging: [
            event,
            { ...event, message: { ...event.message, is_echo: true } },
            { ...event, message: { mid: "attachment-only" } },
            { ...event, recipient: { id: "987654321" } },
            { ...event, timestamp: now + 600000 },
          ],
        },
      ],
    };
    const events = normalizeInstagram(value, now);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      accountId: account,
      senderId: "123456789",
      content: "Hello",
    });
    expect(events[0]).not.toHaveProperty("workspaceId");
  });
  it("honors Meta's UTF-8 byte bound without splitting Unicode characters", () => {
    const text = boundedInstagramText("🟣".repeat(500));
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(1000);
    expect(text).not.toContain("�");
    expect(text.endsWith("…")).toBe(true);
    expect(boundedInstagramText("Hello")).toBe("Hello");
  });
});
