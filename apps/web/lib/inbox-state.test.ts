import { describe, expect, it } from "vitest";
import type {
  InboxThread,
  Message,
  MessageDelivery,
} from "@avenlyo-app/shared";
import { mergeInboxThread, mergeMessages } from "./inbox-state";
const conversation: InboxThread["conversation"] = {
  id: "thread",
  workspace_id: "workspace",
  channel: "website_chat",
  status: "needs_human",
  ai_mode: "paused",
  created_by: null,
  channel_connection_id: null,
  external_customer_ref: "visitor",
  assignee_id: "owner",
  handoff_state: "claimed",
  handoff_at: null,
  claimed_at: null,
  last_customer_at: null,
  state_version: 2,
  created_at: "2026-10-01",
  updated_at: "2026-10-02",
};
const snapshot: InboxThread = {
  conversation,
  messages: [],
  deliveries: [],
  notifications: [],
  lead: null,
  hasEarlier: false,
};
function message(id: string, created_at: string): Message {
  return {
    id,
    created_at,
    workspace_id: "workspace",
    conversation_id: "thread",
    role: "customer",
    human_actor_id: null,
    client_message_id: null,
    content: id,
    sources: [],
  };
}
function delivery(
  status: MessageDelivery["status"],
  updated_at: string,
): MessageDelivery {
  return {
    id: "delivery",
    workspace_id: "workspace",
    conversation_id: "thread",
    connection_id: "connection",
    message_id: "message",
    status,
    provider_message_id: null,
    error_code: null,
    claimed_at: null,
    created_at: "2026-10-01",
    updated_at,
  };
}
describe("Inbox snapshot reconciliation", () => {
  it("does not roll back a claim or AI pause when an older poll finishes", () => {
    const incoming = {
      ...snapshot,
      conversation: {
        ...conversation,
        state_version: 1,
        ai_mode: "active" as const,
        assignee_id: null,
      },
    };
    expect(mergeInboxThread(snapshot, incoming).conversation).toEqual(
      conversation,
    );
  });
  it("accepts an explicit newer resume", () => {
    const incoming = {
      ...snapshot,
      conversation: {
        ...conversation,
        state_version: 3,
        ai_mode: "active" as const,
        assignee_id: null,
      },
    };
    expect(mergeInboxThread(snapshot, incoming).conversation.ai_mode).toBe(
      "active",
    );
  });
  it("retains older-page deliveries and never turns a confirmed send back into pending", () => {
    const previous = {
      ...snapshot,
      deliveries: [delivery("sent", "2026-10-03")],
    };
    expect(
      mergeInboxThread(previous, {
        ...snapshot,
        deliveries: [delivery("pending", "2026-10-01")],
      }).deliveries[0].status,
    ).toBe("sent");
    expect(mergeInboxThread(previous, snapshot).deliveries).toHaveLength(1);
  });
  it("deduplicates overlapping pages and orders messages with a stable timestamp tie-break", () => {
    expect(
      mergeMessages(
        [message("b", "2026-10-02"), message("a", "2026-10-02")],
        [message("b", "2026-10-02"), message("older", "2026-10-01")],
      ).map((m) => m.id),
    ).toEqual(["older", "a", "b"]);
  });
});
