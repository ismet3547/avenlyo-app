import Link from "next/link";
import { ArrowRight, Check, Inbox, TriangleAlert } from "lucide-react";
import type { ChannelConnection } from "@avenlyo-app/shared";
import { ActionLink, Avatar } from "./ui";
import { screenHref } from "@/lib/presentation";
import {
  channelHasIssue,
  channelIsActive,
  customerName,
  waitingLabel,
  type HomeSnapshot,
} from "@/lib/home-model";

export type OverviewModel = HomeSnapshot & { channels: ChannelConnection[] };
export function Overview({
  data,
  preview = false,
}: {
  data: OverviewModel;
  preview?: boolean;
}) {
  const href = (path: string) => screenHref(path, preview);
  const now = Date.now();
  const alerts = data.channels.filter(channelHasIssue);
  const online = data.channels.some(channelIsActive);
  return (
    <div className="operational-home focused-type">
      <header className="home-heading">
        <div>
          <h1>
            {online
              ? "Your front office is live"
              : "Your front office needs attention"}
          </h1>
          <p>
            {online
              ? "Avenlyo is handling customer conversations."
              : "Reconnect a channel to receive customer conversations."}
          </p>
        </div>
        <ActionLink href={href("/app/inbox")}>
          <Inbox aria-hidden="true" />
          Open Inbox
        </ActionLink>
      </header>
      {!online && !alerts.length && (
        <div className="home-alert" role="alert">
          <TriangleAlert aria-hidden="true" />
          <div>
            <strong>Customer channels are offline</strong>
            <p>Customer messages cannot reach Avenlyo.</p>
          </div>
          <Link className="text-link" href={href("/app/channels")}>
            Review connection <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}
      {alerts.map((channel) => (
        <div className="home-alert" role="alert" key={channel.id}>
          <TriangleAlert aria-hidden="true" />
          <div>
            <strong>
              {channel.channel === "website_chat"
                ? "Website Chat"
                : "Instagram"}{" "}
              needs attention
            </strong>
            <p>Customer messages may not reach Avenlyo.</p>
          </div>
          <Link className="text-link" href={href("/app/channels")}>
            Review connection <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ))}
      <section className="home-section" aria-labelledby="attention-heading">
        <h2 id="attention-heading">Needs your attention</h2>
        {data.attention.length ? (
          <>
            <ul className="home-list home-attention">
              {data.attention.map((item, i) => (
                <li
                  key={item.id}
                  className={i === 2 ? "desktop-home-item" : undefined}
                >
                  <Link
                    className="home-conversation"
                    href={href(`/app/inbox/${item.id}`)}
                  >
                    <Avatar name={customerName(item)} small />
                    <div className="home-conversation-copy">
                      <h3>{customerName(item)}</h3>
                      <p>
                        {item.preview ||
                          "This conversation needs your team’s help."}
                      </p>
                      <span className="home-meta">
                        {item.channel === "website_chat"
                          ? "Website Chat"
                          : "Instagram"}{" "}
                        ·{" "}
                        <time dateTime={item.at}>
                          {waitingLabel(item.at, now)}
                        </time>
                      </span>
                    </div>
                    <span className="home-open">
                      Open <ArrowRight aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {data.attentionCount > 2 && (
              <Link
                className={`text-link home-all ${data.attentionCount <= 3 ? "mobile-home-item" : ""}`}
                href={href("/app/inbox")}
              >
                View all {data.attentionCount} in Inbox{" "}
                <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </>
        ) : (
          <div className="home-no-action">
            <Check aria-hidden="true" />
            <div>
              <strong>No action needed</strong>
              <p>
                {online
                  ? "Avenlyo is handling current conversations."
                  : "Your team has no waiting conversations."}
              </p>
            </div>
          </div>
        )}
      </section>
      <section className="home-section" aria-labelledby="recent-heading">
        <h2 id="recent-heading">Recent</h2>
        {data.recent.length ? (
          <ul className="home-list home-recent">
            {data.recent.map((item, i) => (
              <li
                key={item.id}
                className={i === 4 ? "desktop-home-item" : undefined}
              >
                <Link
                  className="home-conversation"
                  href={href(`/app/inbox/${item.id}`)}
                >
                  <Avatar name={customerName(item)} small />
                  <div className="home-conversation-copy">
                    <h3>{customerName(item)}</h3>
                    <p>{item.preview ? `“${item.preview}”` : item.activity}</p>
                  </div>
                  <span className="home-meta">
                    {item.channel === "website_chat"
                      ? "Website Chat"
                      : "Instagram"}{" "}
                    ·{" "}
                    <time dateTime={item.at}>{waitingLabel(item.at, now)}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="home-first-customer">
            <strong>
              {online ? "You’re live." : "No recent conversations"}
            </strong>
            <p>
              {online
                ? "Avenlyo is ready for your first customer conversation."
                : "Recent customer conversations will appear here."}
            </p>
          </div>
        )}
        <Link className="text-link home-all" href={href("/app/inbox")}>
          View all in Inbox <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
