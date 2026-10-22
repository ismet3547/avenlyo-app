import { describe, expect, it } from "vitest";
import {
  agentIdentitySchema,
  agentLanguagesSchema,
  agentScopeSchema,
  agentBehaviorSchema,
} from "./agents.ts";
import { defaultSettings } from "./schemas.ts";
describe("Agent V2 boundaries", () => {
  it("validates a bounded identity without global uniqueness", () => {
    const value = {
      name: "Sales Assistant",
      setup_brief: "Help with customer inquiries.",
      primary_language: "tr",
    };
    expect(agentIdentitySchema.parse(value)).toEqual(value);
    expect(agentIdentitySchema.safeParse({ ...value, name: "x" }).success).toBe(
      false,
    );
    expect(
      agentIdentitySchema.safeParse({ ...value, primary_language: "unknown" })
        .success,
    ).toBe(false);
  });
  it("requires one primary language and unique additional choices", () => {
    expect(
      agentLanguagesSchema.safeParse({
        primary_language: "en",
        additional_languages: ["tr", "de"],
      }).success,
    ).toBe(true);
    for (const additional_languages of [["en"], ["tr", "tr"], ["unknown"]])
      expect(
        agentLanguagesSchema.safeParse({
          primary_language: "en",
          additional_languages,
        }).success,
      ).toBe(false);
    expect(
      agentLanguagesSchema.safeParse({ additional_languages: ["tr"] }).success,
    ).toBe(false);
  });
  it("limits bindings to unique item identities", () => {
    const id = "12345678-1234-4234-8234-123456789012";
    expect(
      agentScopeSchema.safeParse({ mode: "selected", item_ids: [id] }).success,
    ).toBe(true);
    expect(
      agentScopeSchema.safeParse({ mode: "selected", item_ids: [] }).success,
    ).toBe(true);
    expect(
      agentScopeSchema.safeParse({ mode: "selected", item_ids: [id, id] })
        .success,
    ).toBe(false);
    expect(
      agentScopeSchema.safeParse({ mode: "all", item_ids: [id] }).success,
    ).toBe(false);
  });
  it("preserves immutable handoff and contact collection validation", () => {
    expect(agentBehaviorSchema.safeParse(defaultSettings).success).toBe(true);
    expect(
      agentBehaviorSchema.safeParse({
        ...defaultSettings,
        human_handoff_enabled: false,
      }).success,
    ).toBe(false);
    expect(
      agentBehaviorSchema.safeParse({
        ...defaultSettings,
        goals: ["human_handoff"],
        contact_fields: ["email"],
      }).success,
    ).toBe(false);
  });
});
