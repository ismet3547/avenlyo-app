import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@avenlyo-app/shared";
import { z } from "zod";
import type { Config } from "../config.js";
import type { FrontOfficeRuntime } from "../runtime/agent.js";
import type {
  BusinessEmailProvider,
  InstagramTransport,
  SendOutcome,
} from "./transports.js";

const deliverySchema = z.object({
  deliveryId: z.uuid(),
  accountId: z.string(),
  recipientId: z.string(),
  accessToken: z.string(),
  apiVersion: z.string(),
  text: z.string(),
});
const notificationSchema = z.object({
  notificationId: z.uuid(),
  conversationId: z.uuid(),
  kind: z.enum(["qualified_lead", "human_assistance"]),
  to: z.email(),
});
function safeOutcome(value: SendOutcome): SendOutcome {
  return {
    state: ["sent", "failed", "unknown"].includes(value.state)
      ? value.state
      : "unknown",
    providerMessageId: value.providerMessageId?.slice(0, 200),
    code:
      value.code && /^[A-Z0-9_]{1,80}$/.test(value.code)
        ? value.code
        : undefined,
  };
}
// A small channel drain, not an automation platform. DB claims protect multiple API instances.
export class ChannelWork {
  private flight: Promise<void> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  constructor(
    private readonly service: SupabaseClient<Database>,
    private readonly runtime: FrontOfficeRuntime | null,
    private readonly instagram: InstagramTransport,
    private readonly email: BusinessEmailProvider | null,
    private readonly config: Config,
    private readonly log: (event: string, code: string) => void,
  ) {}
  start() {
    this.timer = setInterval(() => {
      void this.pump();
    }, 2000);
    this.timer.unref();
  }
  async stop() {
    if (this.timer) clearInterval(this.timer);
    await this.flight;
  }
  pump(): Promise<void> {
    if (this.flight) return this.flight;
    this.flight = this.drain()
      .catch(() => {
        this.log("channel.work.failed", "CHANNEL_WORK_UNAVAILABLE");
      })
      .finally(() => {
        this.flight = null;
      });
    return this.flight;
  }
  private async drain() {
    for (let i = 0; i < 10; i++) {
      const next = await this.service.rpc("claim_instagram_event", {});
      if (next.error) throw new Error("Channel claim unavailable");
      const run = next.data?.[0];
      if (!run) break;
      try {
        if (this.runtime) await this.runtime.channelTurn(run);
        else {
          await this.service.rpc("fail_channel_turn", {
            target_run_id: run.run_id,
          });
        }
      } catch {
        this.log("channel.turn.failed", "CHANNEL_TURN_UNAVAILABLE");
      }
    }
    for (let i = 0; i < 20; i++) if (!(await this.deliverMessage())) break;
    for (let i = 0; i < 20; i++) if (!(await this.notify())) break;
  }
  async deliverMessage(messageId: string | null = null): Promise<boolean> {
    const claimed = await this.service.rpc("claim_message_delivery", {
      target_message_id: messageId,
    });
    if (claimed.error) throw new Error("Delivery claim unavailable");
    if (!claimed.data) return false;
    if (typeof claimed.data === "object" && "skipped" in claimed.data)
      return true;
    const send = deliverySchema.parse(claimed.data);
    let outcome: SendOutcome;
    try {
      outcome = safeOutcome(await this.instagram.send(send));
    } catch {
      outcome = { state: "unknown", code: "SEND_OUTCOME_UNKNOWN" };
    }
    // A lost DB acknowledgement leaves 'sending'; the sweep closes it as unknown, never resends.
    const finished = await this.service.rpc("finish_message_delivery", {
      target_delivery_id: send.deliveryId,
      delivery_state: outcome.state,
      provider_message_id: outcome.providerMessageId ?? null,
      failure_code: outcome.code ?? null,
    });
    if (finished.error)
      this.log("delivery.record.failed", "DELIVERY_OUTCOME_UNRECORDED");
    else this.log("delivery.completed", outcome.state.toUpperCase());
    return true;
  }
  async notify(conversationId: string | null = null): Promise<boolean> {
    const claimed = await this.service.rpc("claim_business_notification", {
      target_conversation_id: conversationId,
    });
    if (claimed.error) throw new Error("Notification claim unavailable");
    if (!claimed.data) return false;
    if (typeof claimed.data === "object" && "skipped" in claimed.data)
      return true;
    const item = notificationSchema.parse(claimed.data);
    let outcome: SendOutcome = {
      state: "failed",
      code: "NOTIFICATION_NOT_CONFIGURED",
    };
    if (this.email) {
      const subject =
        item.kind === "qualified_lead"
          ? "A new qualified inquiry in Avenlyo"
          : "A conversation needs your team";
      try {
        outcome = safeOutcome(
          await this.email.send({
            notificationId: item.notificationId,
            to: item.to,
            from:
              this.config.BUSINESS_NOTIFICATION_FROM ??
              "Avenlyo <notifications@example.invalid>",
            subject,
            text: `${subject}. Open Inbox to review it: ${new URL(`/app/inbox/${item.conversationId}`, this.config.PUBLIC_APP_URL).href}`,
          }),
        );
      } catch {
        outcome = { state: "unknown", code: "EMAIL_OUTCOME_UNKNOWN" };
      }
    }
    const saved = await this.service.rpc("finish_business_notification", {
      target_notification_id: item.notificationId,
      notification_state: outcome.state,
      failure_code: outcome.code ?? null,
    });
    if (saved.error)
      this.log("notification.record.failed", "NOTIFICATION_OUTCOME_UNRECORDED");
    else this.log("notification.completed", outcome.state.toUpperCase());
    return true;
  }
  async notifyConversation(conversationId: string) {
    // Failure is isolated from the already committed customer/lead/handoff transaction.
    try {
      for (let i = 0; i < 2; i++)
        if (!(await this.notify(conversationId))) break;
    } catch {
      this.log("notification.failed", "NOTIFICATION_UNAVAILABLE");
    }
  }
}
