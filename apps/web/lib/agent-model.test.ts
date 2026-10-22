import { describe, it, expect } from "vitest";
import type { ChannelConnection } from "@avenlyo-app/shared";
import { agentStatus, agentLanguageSummary } from "./agent-model";
const website = {
  channel: "website_chat",
  enabled: true,
  status: "ready",
  approved_origins: ["https://example.test"],
  verified_at: null,
  last_activity_at: null,
} as ChannelConnection;
describe("Agent operational summaries", () => {
  it("never treats an unconnected Agent as a provider error", () =>
    expect(agentStatus([])).toBe("Ready"));
  it("derives live from real inbound activation", () =>
    expect(agentStatus([website])).toBe("Live"));
  it("keeps a real failure visible even with another live channel", () =>
    expect(
      agentStatus([
        website,
        { ...website, status: "needs_attention", enabled: false },
      ]),
    ).toBe("Issue"));
  it("does not call a disabled never-activated channel live", () =>
    expect(agentStatus([{ ...website, enabled: false }])).toBe("Ready"));
  it("summarizes explicit and legacy languages", () => {
    expect(
      agentLanguageSummary({
        primary_language: "tr",
        additional_languages: ["en", "de"],
        language_policy: "configured",
      }),
    ).toBe("Turkish, English, German");
    expect(
      agentLanguageSummary({
        primary_language: "en",
        additional_languages: [],
        language_policy: "legacy_multilingual",
      }),
    ).toBe("English · Multilingual");
  });
});
