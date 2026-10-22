import { describe, expect, it } from "vitest";
import type { ChannelConnection } from "@avenlyo-app/shared";
import {
  channelHasIssue,
  channelIsActive,
  homeChannelState,
  customerName,
  waitingLabel,
} from "./home-model";
describe("Home presentation", () => {
  it("uses a known customer name or a human readable channel fallback", () => {
    expect(customerName({ name: " Alex ", channel: "website_chat" })).toBe(
      "Alex",
    );
    expect(customerName({ name: null, channel: "website_chat" })).toBe(
      "Website visitor",
    );
    expect(customerName({ name: " ", channel: "instagram" })).toBe(
      "Instagram customer",
    );
  });
  it("shows actual waiting duration and handles clock skew", () => {
    const now = Date.parse("2026-10-20T10:00:00Z");
    expect(waitingLabel("2026-10-20T09:56:00Z", now)).toBe("4 min ago");
    expect(waitingLabel("2026-10-20T08:00:00Z", now)).toBe("2 hr ago");
    expect(waitingLabel("2026-10-18T10:00:00Z", now)).toBe("2 days ago");
    expect(waitingLabel("2026-10-20T10:01:00Z", now)).toBe("Just now");
  });
});

describe("real channel health", () => {
  const channel: ChannelConnection = {
    id: "channel",
    public_id: "public",
    workspace_id: "workspace",
    channel: "website_chat",
    enabled: false,
    status: "ready",
    approved_origins: ["https://example.test"],
    provider_account_id: null,
    provider_username: null,
    api_version: null,
    verified_at: null,
    last_activity_at: null,
    created_at: "",
    updated_at: "",
  };
  it("does not alert for a channel that was never activated", () => {
    expect(channelHasIssue(channel)).toBe(false);
    expect(channelIsActive(channel)).toBe(false);
    expect(homeChannelState([], null)).toBe("ready");
    expect(homeChannelState([channel], null)).toBe("ready");
  });
  it("becomes live only after an inbound channel is actually active", () => {
    expect(homeChannelState([{ ...channel, enabled: true }], null)).toBe(
      "live",
    );
    expect(
      homeChannelState(
        [{ ...channel, enabled: true, approved_origins: [] }],
        null,
      ),
    ).toBe("ready");
    expect(
      homeChannelState(
        [
          {
            ...channel,
            channel: "instagram",
            enabled: true,
            status: "connected",
          },
        ],
        null,
      ),
    ).toBe("ready");
  });
  it("reports a formerly active channel offline even without customer traffic", () => {
    expect(homeChannelState([channel], "2026-10-20T10:00:00Z")).toBe("offline");
    expect(homeChannelState([], "2026-10-20T10:00:00Z")).toBe("offline");
    expect(
      homeChannelState([{ ...channel, enabled: true }], "2026-10-20T10:00:00Z"),
    ).toBe("live");
  });
  it("reports recorded provider failure even when it disabled the connection", () => {
    expect(
      channelHasIssue({
        ...channel,
        channel: "instagram",
        status: "needs_attention",
      }),
    ).toBe(true);
  });
  it("distinguishes healthy channels from a previously used channel going offline", () => {
    expect(channelIsActive({ ...channel, enabled: true })).toBe(true);
    expect(
      channelHasIssue({ ...channel, last_activity_at: "2026-10-20T10:00:00Z" }),
    ).toBe(true);
    expect(
      channelIsActive({
        ...channel,
        channel: "instagram",
        enabled: true,
        status: "connected",
      }),
    ).toBe(false);
  });
});
