import type { InboxItem, InboxThread, Message } from "@avenlyo-app/shared";

export function inboxPage(value?: string) {
  return Math.max(0, Math.min(2000, Number.parseInt(value ?? "0", 10) || 0));
}
export function customerLabel(channel: string, reference: string | null) {
  if (
    channel === "website_chat" &&
    (!reference || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(reference))
  )
    return reference
      ? `Website visitor · ${reference.slice(0, 8)}`
      : "Website visitor";
  return (
    reference ||
    (channel === "website_chat" ? "Website visitor" : "Instagram customer")
  );
}
export function filterInbox(
  items: InboxItem[],
  filter: string,
  search: string,
  actorId: string,
) {
  const needle = search.trim().toLowerCase();
  return items.filter(
    (item) =>
      (filter !== "paused" || item.aiMode === "paused") &&
      (filter !== "mine" || item.assigneeId === actorId) &&
      (!needle ||
        `${customerLabel(item.channel, item.customerRef)} ${item.customerRef} ${item.preview ?? ""}`
          .toLowerCase()
          .includes(needle)),
  );
}
export function mergeMessages(current: Message[], incoming: Message[]) {
  return [
    ...new Map([...current, ...incoming].map((m) => [m.id, m])).values(),
  ].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}
// A poll started before a team action can finish after it. Keep confirmed newer ownership.
export function mergeThread(
  current: InboxThread,
  incoming: InboxThread,
): InboxThread {
  return {
    ...incoming,
    conversation:
      incoming.conversation.state_version < current.conversation.state_version
        ? current.conversation
        : incoming.conversation,
    lead:
      incoming.conversation.state_version < current.conversation.state_version
        ? current.lead
        : incoming.lead,
    deliveries: [
      ...new Map(
        [...current.deliveries, ...incoming.deliveries]
          .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
          .map((d) => [d.id, d]),
      ).values(),
    ],
    messages: mergeMessages(current.messages, incoming.messages),
  };
}
