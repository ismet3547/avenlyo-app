import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";

export function newVisitorCredential() {
  return randomBytes(32).toString("base64url");
}
export function credentialHash(credential: string) {
  return createHash("sha256").update(credential).digest("hex");
}
export function visitorCredential(header: string | undefined): string | null {
  return header && /^Bearer [A-Za-z0-9_-]{43}$/.test(header)
    ? header.slice(7)
    : null;
}
export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function validMetaSignature(
  raw: Buffer,
  signature: string | undefined,
  secret: string,
) {
  if (!signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const digest = createHmac("sha256", secret).update(raw).digest();
  return timingSafeEqual(digest, Buffer.from(signature.slice(7), "hex"));
}
const numericId = z.string().regex(/^\d{3,32}$/);
const eventSchema = z.object({
  sender: z.object({ id: numericId }),
  recipient: z.object({ id: numericId }),
  timestamp: z.number().int().positive(),
  message: z.object({
    mid: z.string().min(1).max(200),
    text: z.string().trim().min(1).max(2000),
    is_echo: z.boolean().optional(),
    is_deleted: z.boolean().optional(),
  }),
});
export type InstagramInbound = {
  accountId: string;
  senderId: string;
  messageId: string;
  content: string;
  timestamp: string;
  payloadHash: string;
};
export function normalizeInstagram(
  value: unknown,
  now = Date.now(),
): InstagramInbound[] {
  const envelope = z
    .object({
      object: z.literal("instagram"),
      entry: z
        .array(
          z.object({
            id: numericId,
            messaging: z.array(z.unknown()).max(50).optional(),
          }),
        )
        .max(10),
    })
    .safeParse(value);
  if (!envelope.success) return [];
  const events: InstagramInbound[] = [];
  for (const entry of envelope.data.entry)
    for (const raw of entry.messaging ?? []) {
      if (events.length >= 50) break;
      const parsed = eventSchema.safeParse(raw);
      if (!parsed.success) continue;
      const e = parsed.data;
      if (
        e.recipient.id !== entry.id ||
        e.sender.id === entry.id ||
        e.message.is_echo ||
        e.message.is_deleted ||
        e.timestamp > now + 300000
      )
        continue;
      const data = {
        accountId: entry.id,
        senderId: e.sender.id,
        messageId: e.message.mid,
        content: e.message.text,
        timestamp: new Date(Math.min(e.timestamp, now)).toISOString(),
      };
      events.push({
        ...data,
        payloadHash: credentialHash(
          JSON.stringify({ ...data, timestamp: e.timestamp }),
        ),
      });
    }
  return events;
}
// Meta's text bound is bytes, not JavaScript characters. Persist exactly what is sent.
export function boundedInstagramText(text: string, limit = 1000) {
  if (Buffer.byteLength(text, "utf8") <= limit) return text;
  let result = "";
  let size = 0;
  for (const character of text) {
    const bytes = Buffer.byteLength(character, "utf8");
    if (size + bytes > limit - 3) break;
    result += character;
    size += bytes;
  }
  return result.trimEnd() + "…";
}
