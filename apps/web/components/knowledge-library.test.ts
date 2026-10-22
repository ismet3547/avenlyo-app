import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { KnowledgeItem } from "@avenlyo-app/shared";
import { KnowledgeLibrary } from "./knowledge-library";
vi.mock("@/app/app/knowledge/actions", () => ({
  knowledgeEditorOperation: vi.fn(),
}));
const item: KnowledgeItem = {
  id: "item",
  workspace_id: "workspace",
  title: "Website project pricing",
  type: "pricing",
  content: "Do not show this large preview.",
  price_statement: "$2,500",
  currency: "USD",
  details: "",
  runtime_content: "",
  collection_id: "collection",
  status: "published",
  revision: 999,
  embedding: null,
  created_at: "2026-10-20T10:00:00Z",
  updated_at: "2026-10-20T10:00:00Z",
};
const render = (items: KnowledgeItem[], archived = false) =>
  renderToStaticMarkup(
    createElement(KnowledgeLibrary, {
      items,
      archived,
      collections: [],
      editable: true,
      now: Date.parse("2026-10-20T10:00:00Z"),
    }),
  );
describe("Knowledge library hierarchy", () => {
  it("has a creation-only zero state without management controls", () => {
    const html = render([]);
    for (const text of [
      "Give Avenlyo the information it needs",
      "Add manually",
      "Import webpage",
      "Upload file",
    ])
      expect(html).toContain(text);
    for (const text of [
      "Search knowledge",
      "Knowledge status",
      "Filter knowledge",
      "View archived",
      "Manage collections",
      "0 items",
    ])
      expect(html).not.toContain(text);
  });
  it("uses the true zero state when only archived knowledge exists", () =>
    expect(render([{ ...item, status: "archived" }])).toContain(
      "knowledge-zero",
    ));
  it("shows focused rows and secondary organization, without content previews or row action clutter", () => {
    const html = render([item]);
    expect(html).toContain("Website project pricing");
    expect(html).toContain("Pricing");
    expect(html).toContain("Published");
    expect(html).toContain("Updated just now");
    expect(html).toContain("Search knowledge");
    expect(html).toContain("Knowledge status");
    expect(html).not.toContain(item.content);
    expect(html).not.toContain("999");
    expect(html).not.toContain("No collection");
    expect(html).not.toContain("Archive item");
    expect(html).not.toContain("knowledge-tab-archived");
  });
  it("provides archived maintenance with Restore and no creation or publication controls", () => {
    const html = render([{ ...item, status: "archived" }], true);
    expect(html).toContain("Archived knowledge");
    expect(html).toContain("Search archived knowledge");
    expect(html).toContain("Restore");
    expect(html).not.toContain("Add knowledge");
    expect(html).not.toContain("Knowledge status");
  });
});
