export type SendOutcome = {
  state: "sent" | "failed" | "unknown";
  providerMessageId?: string;
  code?: string;
};
export interface InstagramTransport {
  send(input: {
    deliveryId: string;
    accountId: string;
    recipientId: string;
    accessToken: string;
    apiVersion: string;
    text: string;
  }): Promise<SendOutcome>;
}
export interface BusinessEmailProvider {
  send(input: {
    notificationId: string;
    to: string;
    from: string;
    subject: string;
    text: string;
  }): Promise<SendOutcome>;
}
type Fetch = typeof fetch;
export class MetaInstagramTransport implements InstagramTransport {
  constructor(private readonly request: Fetch = fetch) {}
  async send(
    input: Parameters<InstagramTransport["send"]>[0],
  ): Promise<SendOutcome> {
    if (
      input.apiVersion !== "v26.0" ||
      !/^\d{3,32}$/.test(input.accountId) ||
      !/^\d{3,32}$/.test(input.recipientId) ||
      Buffer.byteLength(input.text, "utf8") > 1000
    )
      return { state: "failed", code: "INVALID_TRANSPORT_INPUT" };
    try {
      const response = await this.request(
        `https://graph.instagram.com/${input.apiVersion}/${input.accountId}/messages`,
        {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(10000),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            recipient: { id: input.recipientId },
            message: { text: input.text },
          }),
        },
      );
      const data = (await response.json().catch(() => null)) as {
        message_id?: unknown;
        error?: { code?: unknown };
      } | null;
      if (
        response.ok &&
        typeof data?.message_id === "string" &&
        data.message_id.length <= 200
      )
        return { state: "sent", providerMessageId: data.message_id };
      if (
        response.status >= 400 &&
        response.status < 500 &&
        typeof data?.error?.code === "number"
      )
        return { state: "failed", code: `META_REJECTED_${data.error.code}` };
      return { state: "unknown", code: "META_OUTCOME_UNKNOWN" };
    } catch {
      return { state: "unknown", code: "META_OUTCOME_UNKNOWN" };
    }
  }
}
export class ResendBusinessEmailProvider implements BusinessEmailProvider {
  constructor(
    private readonly key: string,
    private readonly request: Fetch = fetch,
  ) {}
  async send(
    input: Parameters<BusinessEmailProvider["send"]>[0],
  ): Promise<SendOutcome> {
    try {
      const response = await this.request("https://api.resend.com/emails", {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`,
          "Idempotency-Key": `avenlyo-notification-${input.notificationId}`,
        },
        body: JSON.stringify({
          from: input.from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        id?: unknown;
        name?: unknown;
      } | null;
      if (response.ok && typeof data?.id === "string")
        return { state: "sent", providerMessageId: data.id };
      if (
        response.status >= 400 &&
        response.status < 500 &&
        typeof data?.name === "string"
      )
        return { state: "failed", code: "EMAIL_REJECTED" };
      return { state: "unknown", code: "EMAIL_OUTCOME_UNKNOWN" };
    } catch {
      return { state: "unknown", code: "EMAIL_OUTCOME_UNKNOWN" };
    }
  }
}
