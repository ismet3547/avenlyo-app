import { z } from "zod";
import type { ChannelConnection } from "@avenlyo-app/shared";

const homeConversation = z.object({
  id: z.uuid(),
  name: z.string().nullable(),
  channel: z.enum(["website_chat", "instagram"]),
  preview: z.string().nullable(),
  at: z.string(),
  activity: z.string(),
});
export const homeSchema = z.object({
  attentionCount: z.number().int().nonnegative(),
  attention: z.array(homeConversation).max(3),
  recent: z.array(homeConversation).max(5),
});
export type HomeSnapshot = z.infer<typeof homeSchema>;
export type HomeConversation = HomeSnapshot["recent"][number];
export function channelIsActive(channel: ChannelConnection) {
  return (
    channel.enabled &&
    (channel.channel === "website_chat"
      ? ["ready", "connected"].includes(channel.status) &&
        channel.approved_origins.length > 0
      : channel.status === "connected" && Boolean(channel.verified_at))
  );
}
export function channelHasIssue(channel: ChannelConnection) {
  return (
    channel.status === "needs_attention" ||
    (!channel.enabled &&
      Boolean(channel.verified_at || channel.last_activity_at))
  );
}
export function homeChannelState(
  channels: ChannelConnection[],
  firstChannelActivatedAt: string | null,
) {
  if (channels.some(channelIsActive)) return "live";
  if (firstChannelActivatedAt || channels.some(channelHasIssue))
    return "offline";
  return "ready";
}
export function customerName(item: Pick<HomeConversation, "name" | "channel">) {
  return (
    item.name?.trim() ||
    (item.channel === "instagram" ? "Instagram customer" : "Website visitor")
  );
}
export function waitingLabel(value: string, now: number) {
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(value).getTime()) / 60_000),
  );
  if (!Number.isFinite(minutes)) return "Recently";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}
