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
import { Badge } from "./ui/badge";
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
    <Badge
      tone={
        value === "qualified"
          ? "success"
          : value === "needs_human"
            ? "attention"
            : "neutral"
      }
    >
      {value === "qualified"
        ? "Qualified"
        : value === "needs_human"
          ? "Needs human"
          : "Needs info"}
    </Badge>
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
      className={cn(
        "group block border-l-2 p-4 transition-colors hover:bg-muted/70 sm:p-5",
        selected
          ? "border-l-primary bg-success-soft/60"
          : "border-l-transparent",
      )}
    >
      <div className="flex items-start gap-3">
        {!compact && (
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-xs font-medium text-primary"
          >
            {customerLabel(item).slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="truncate text-[13px] font-medium">
              {customerLabel(item)}
            </span>
            {!compact && (
              <time
                dateTime={item.updatedAt}
                className="text-[11px] tabular-nums text-muted-foreground"
              >
                {dateLabel(item.updatedAt)}
              </time>
            )}
          </div>
          <p
            className={cn(
              "mt-1.5 break-words text-xs leading-5 text-muted-foreground",
              compact ? "line-clamp-2" : "line-clamp-1",
            )}
          >
            {item.preview ?? "Waiting for the first customer message."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ChannelLabel channel={item.channel} />
            {item.aiMode === "paused" ? (
              <Badge tone="attention">
                {compact ? "AI paused" : "Needs human · AI paused"}
              </Badge>
            ) : (
              item.qualification && <Qualification value={item.qualification} />
            )}
          </div>
          {item.assigneeId && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
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
            <p className="mt-2 text-[11px] text-attention">
              Delivery needs attention
            </p>
          )}
        </div>
        {!compact && (
          <ArrowUpRight
            aria-hidden
            className="mt-1 size-3.5 text-muted-foreground group-hover:text-primary"
          />
        )}
      </div>
    </Link>
  );
}
