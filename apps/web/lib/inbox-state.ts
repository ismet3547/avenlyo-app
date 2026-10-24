import type { InboxThread, Message } from "@avenlyo-app/shared";

export function mergeMessages(current: Message[], incoming: Message[]) {
  return [
    ...new Map(
      [...current, ...incoming].map((message) => [message.id, message]),
    ).values(),
  ].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}

export function mergeInboxThread(
  current: InboxThread,
  incoming: InboxThread,
): InboxThread {
  const stale =
    incoming.conversation.state_version < current.conversation.state_version ||
    (incoming.conversation.state_version ===
      current.conversation.state_version &&
      incoming.conversation.updated_at < current.conversation.updated_at);
  const deliveries = new Map(
    current.deliveries.map((delivery) => [delivery.id, delivery]),
  );
  for (const delivery of incoming.deliveries) {
    const previous = deliveries.get(delivery.id);
    if (!previous || delivery.updated_at >= previous.updated_at)
      deliveries.set(delivery.id, delivery);
  }
  return {
    ...(stale ? current : incoming),
    messages: mergeMessages(current.messages, incoming.messages),
    deliveries: [...deliveries.values()],
  };
}
