import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import { defaultSettings, type Agent } from "@avenlyo-app/shared";
vi.mock("@/app/app/agent/actions", () => ({
  createAgent: vi.fn(),
  saveAgentField: vi.fn(),
  archiveAgent: vi.fn(),
}));
import { AgentGeneral } from "./agent-general";
const agent: Agent = {
  ...defaultSettings,
  id: "11111111-1111-4111-8111-111111111111",
  workspace_id: "22222222-2222-4222-8222-222222222222",
  name: "Front Office",
  is_default: true,
  primary_language: "en",
  additional_languages: [],
  language_policy: "configured",
  knowledge_mode: "all",
  created_at: "",
  updated_at: "",
  archived_at: null,
};
describe("compact Agent General", () => {
  it("exposes focused owner edits and immutable handoff without the old preview", () => {
    const html = renderToStaticMarkup(
      createElement(AgentGeneral, { agent, editable: true }),
    );
    expect(html).toContain('aria-label="Edit name"');
    expect(html).toContain('aria-label="Edit role"');
    expect(html).toContain("Always available");
    expect(html).not.toContain("Edit human handoff");
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain("Configuration preview");
    expect(html).not.toContain("Good answers start");
  });
  it("does not offer owner mutations to members", () => {
    const html = renderToStaticMarkup(
      createElement(AgentGeneral, { agent, editable: false }),
    );
    expect(html).toContain("Only workspace owners");
    expect(html).not.toContain('aria-label="Edit');
    expect(html).not.toContain("Archive agent");
    expect(html).toContain("Always available");
  });
  it("hides contact-field editing when contact collection is disabled", () => {
    const html = renderToStaticMarkup(
      createElement(AgentGeneral, {
        agent: {
          ...agent,
          goals: ["answer_questions", "human_handoff"],
          contact_fields: [],
        },
        editable: true,
      }),
    );
    expect(html).toContain("Not collected");
    expect(html).not.toContain('aria-label="Edit contact details"');
  });
});
