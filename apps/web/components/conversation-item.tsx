import Link from "next/link";
import {
  Globe,
  MessageCircle,
  FlaskConical,
  UserRound,
  ArrowUpRight,
} from "lucide-react";
import {
  channelLabels,
  type Channel,
  type InboxItem,
} from "@avenlyo-app/shared";
import { cn, dateLabel } from "@/lib/utils";
export function ChannelLabel({ channel }: { channel: Channel }) {
  const Icon =
    channel === "website_chat"
      ? Globe
      : channel === "instagram"
        ? MessageCircle
        : FlaskConical;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon aria-hidden className="size-3.5" />
      {channelLabels[channel]}
    </span>
  );
}
export function Qualification({ value }: { value: string }) {
  return (
    <span
      className="status-text"
      data-tone={
        value === "qualified"
          ? "success"
          : value === "needs_human"
            ? "attention"
            : undefined
      }
    >
      {value === "qualified"
        ? "Qualified"
        : value === "needs_human"
          ? "Needs human"
          : "Needs info"}
    </span>
  );
}
export function customerLabel(item: InboxItem) {
  return item.channel === "website_chat" &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      item.customerRef,
    )
    ? `Website visitor · ${item.customerRef.slice(0, 8)}`
    : item.customerRef;
}
export function ConversationItem({
  item,
  actorId,
  selected,
  compact = false,
}: {
  item: InboxItem;
  actorId: string;
  selected?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/app/inbox/${item.id}`}
      aria-current={selected ? "page" : undefined}
      data-compact={compact}
      className={cn("conversation-row group", !compact && "sm:px-2")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[13px] font-semibold">
          {customerLabel(item)}
        </span>
        <time dateTime={item.updatedAt} className="conversation-time">
          {dateLabel(item.updatedAt)}
        </time>
      </div>
      <p
        className={cn(
          "mt-1.5 break-words text-[13px] leading-5 text-muted-foreground",
          compact ? "line-clamp-2" : "line-clamp-1",
        )}
      >
        {item.preview ?? "Waiting for the first customer message."}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <ChannelLabel channel={item.channel} />
        {item.aiMode === "paused" ? (
          <span className="status-text" data-tone="attention">
            {compact ? "AI paused" : "Needs human"}
          </span>
        ) : item.qualification === "qualified" ? (
          <span className="text-xs font-medium text-success">Qualified</span>
        ) : null}
        {!compact && (
          <ArrowUpRight
            aria-hidden
            className="ml-auto size-3.5 text-muted-foreground group-hover:text-primary"
          />
        )}
      </div>
      {item.assigneeId && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserRound aria-hidden className="size-3" />
          {compact
            ? item.assigneeId === actorId
              ? "Assigned to you"
              : "Assigned to a teammate"
            : item.assigneeId === actorId
              ? "Claimed by you"
              : "Claimed by a team member"}
        </p>
      )}
      {item.needsAttention && (
        <p className="mt-2 text-xs text-attention">Delivery needs attention</p>
      )}
    </Link>
  );
}
