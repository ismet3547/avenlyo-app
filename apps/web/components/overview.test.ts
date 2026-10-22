import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ChannelConnection } from "@avenlyo-app/shared";
import { Overview, type OverviewModel } from "./overview";

const ready: OverviewModel = {
  channels: [],
  firstChannelActivatedAt: null,
  attentionCount: 0,
  attention: [],
  recent: [],
};
const channel: ChannelConnection = {
  id: "channel",
  public_id: "public",
  workspace_id: "workspace",
  agent_id: "af666666-6666-4666-8666-666666666666",
  channel: "website_chat",
  enabled: true,
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
const render = (data: OverviewModel) =>
  renderToStaticMarkup(createElement(Overview, { data }));
describe("READY and LIVE Home", () => {
  it("shows the intentional READY state without operational placeholders or warnings", () => {
    const html = render(ready);
    expect(html).toContain("Your front office is ready");
    expect(html).toContain(
      "Connect a channel when you’re ready to start receiving customer conversations.",
    );
    expect(html).toContain('href="/app/channels"');
    expect(html).toContain("Connect channel");
    for (const absent of [
      "Needs your attention",
      "Recent",
      "Open Inbox",
      'role="alert"',
      "offline",
      "No action needed",
      "No recent conversations",
    ])
      expect(html).not.toContain(absent);
  });
  it("resumes operational Home when a real inbound channel becomes active", () => {
    const html = render({ ...ready, channels: [channel] });
    expect(html).toContain("Your front office is live");
    expect(html).toContain("Needs your attention");
    expect(html).toContain("Recent");
    expect(html).toContain("Open Inbox");
  });
  it("treats a previously active channel going offline as an operational problem", () => {
    const html = render({
      ...ready,
      channels: [{ ...channel, enabled: false }],
      firstChannelActivatedAt: "2026-10-20T10:00:00Z",
    });
    expect(html).toContain("Your front office needs attention");
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("Your front office is ready");
  });
});
