import { describe, expect, it } from "vitest";
import type {
  InboxItem,
  InboxThread,
  Message,
  MessageDelivery,
} from "@avenlyo-app/shared";
import {
  customerLabel,
  filterInbox,
  mergeMessages,
  mergeThread,
} from "./inbox";

const time = (minute: number) =>
  `2026-10-18T12:${String(minute).padStart(2, "0")}:00Z`;
const message = (id: string, minute: number) =>
  ({ id, created_at: time(minute), content: id, role: "customer" }) as Message;
function thread(
  version: number,
  assignee: string | null,
  messages: Message[] = [],
): InboxThread {
  return {
    conversation: {
      id: "conversation",
      state_version: version,
      assignee_id: assignee,
      ai_mode: assignee ? "paused" : "active",
    } as InboxThread["conversation"],
    messages,
    lead: null,
    deliveries: [],
    notifications: [],
    hasEarlier: false,
  };
}
const delivery = (status: MessageDelivery["status"], minute: number) =>
  ({
    id: "delivery",
    message_id: "reply",
    status,
    updated_at: time(minute),
  }) as MessageDelivery;

describe("Inbox reads arriving out of order", () => {
  it("does not undo a confirmed claim when an older poll finishes late", () => {
    const claimed = thread(4, "teammate", [message("first", 1)]);
    const earlierPoll = thread(3, null, [message("new-customer-message", 2)]);
    const merged = mergeThread(claimed, earlierPoll);
    expect(merged.conversation.assignee_id).toBe("teammate");
    expect(merged.conversation.ai_mode).toBe("paused");
    expect(merged.messages.map((m) => m.id)).toEqual([
      "first",
      "new-customer-message",
    ]);
  });
  it("accepts a newer release and retains already loaded history", () => {
    const claimed = thread(4, "me", [
      message("earlier", 1),
      message("latest", 5),
    ]);
    const released = thread(5, null, [message("latest", 5)]);
    released.conversation.ai_mode = "paused";
    const merged = mergeThread(claimed, released);
    expect(merged.conversation.assignee_id).toBeNull();
    expect(merged.conversation.ai_mode).toBe("paused");
    expect(merged.messages).toHaveLength(2);
  });
  it("keeps newer delivery evidence when a stale read says pending", () => {
    const current = {
      ...thread(4, "me"),
      deliveries: [delivery("available", 8)],
    };
    const stale = { ...thread(4, "me"), deliveries: [delivery("pending", 7)] };
    expect(mergeThread(current, stale).deliveries[0]?.status).toBe("available");
    const unconfirmed = {
      ...thread(4, "me"),
      deliveries: [delivery("unknown", 9)],
    };
    expect(mergeThread(current, unconfirmed).deliveries[0]?.status).toBe(
      "unknown",
    );
  });
  it("deduplicates overlapping history pages and uses stable ordering for tied timestamps", () => {
    expect(
      mergeMessages(
        [message("b", 2), message("c", 3)],
        [message("a", 2), message("b", 2), message("older", 1)],
      ).map((m) => m.id),
    ).toEqual(["older", "a", "b", "c"]);
  });
});

describe("Inbox identity and page filters", () => {
  const visitor = "12345678-1234-4234-8234-123456789012";
  const items = [
    {
      id: "one",
      channel: "website_chat",
      customerRef: visitor,
      preview: "Design question",
      aiMode: "active",
      assigneeId: null,
    },
    {
      id: "two",
      channel: "website_chat",
      customerRef: "Alexandra Hamilton",
      preview: "Help with a project",
      aiMode: "paused",
      assigneeId: "me",
    },
    {
      id: "three",
      channel: "instagram",
      customerRef: "instagram-customer",
      preview: "Design question",
      aiMode: "paused",
      assigneeId: "teammate",
    },
  ] as InboxItem[];
  it("preserves a customer name provided by the member-scoped queue", () => {
    expect(customerLabel("website_chat", "Alexandra Hamilton")).toBe(
      "Alexandra Hamilton",
    );
    expect(customerLabel("website_chat", visitor)).toBe(
      "Website visitor · 12345678",
    );
  });
  it("combines ownership and text filters without returning a teammate's thread", () => {
    expect(
      filterInbox(items, "mine", "  PROJECT ", "me").map((i) => i.id),
    ).toEqual(["two"]);
    expect(filterInbox(items, "mine", "design", "me")).toHaveLength(0);
    expect(filterInbox(items, "paused", "", "me").map((i) => i.id)).toEqual([
      "two",
      "three",
    ]);
  });
  it("can find a full customer reference even when its visible label is shortened", () => {
    expect(filterInbox(items, "all", visitor, "me").map((i) => i.id)).toEqual([
      "one",
    ]);
  });
});
