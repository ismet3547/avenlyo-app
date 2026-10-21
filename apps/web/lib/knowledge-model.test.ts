import { describe, expect, it } from "vitest";
import type { KnowledgeItem } from "@avenlyo-app/shared";
import {
  convertKnowledgeType,
  filterKnowledge,
  joinServiceDetails,
  knowledgeFields,
  knowledgeUpdatedLabel,
  splitServiceDetails,
} from "./knowledge-model";
const item = (patch: Partial<KnowledgeItem> = {}): KnowledgeItem => ({
  id: "id",
  workspace_id: "workspace",
  type: "custom_note",
  title: "Logo design",
  content: "Useful business facts.",
  price_statement: "",
  currency: "",
  details: "",
  collection_id: null,
  runtime_content: "Useful business facts.",
  status: "draft",
  revision: 1,
  embedding: null,
  created_at: "2026-10-20T10:00:00Z",
  updated_at: "2026-10-20T10:00:00Z",
  ...patch,
});
describe("Knowledge library selection", () => {
  const items = [
    item(),
    item({
      id: "price",
      type: "pricing",
      price_statement: "$2,500",
      currency: "USD",
      collection_id: "collection",
      status: "published",
    }),
    item({ id: "legacy", type: "text" }),
    item({ id: "archived", status: "archived" }),
  ];
  it("excludes archived items from the active library", () =>
    expect(filterKnowledge(items, {})).toHaveLength(3));
  it("keeps archived maintenance separate", () =>
    expect(filterKnowledge(items, { archived: true }).map((i) => i.id)).toEqual(
      ["archived"],
    ));
  it("combines status, type, collection and supported searchable fields", () => {
    expect(
      filterKnowledge(items, {
        status: "published",
        type: "pricing",
        collection: "collection",
        query: "usd",
      }).map((i) => i.id),
    ).toEqual(["price"]);
    expect(filterKnowledge(items, { query: "$2,500" })).toHaveLength(1);
    expect(filterKnowledge(items, { query: "BUSINESS facts" })).toHaveLength(3);
    expect(filterKnowledge(items, { query: "missing" })).toHaveLength(0);
  });
  it("finds legacy Text as Custom note", () =>
    expect(
      filterKnowledge(items, { type: "custom_note" }).map((i) => i.id),
    ).toEqual(["id", "legacy"]));
});
describe("safe editor type transitions", () => {
  it("preserves a price statement, currency, title and conditions when leaving Pricing", () => {
    const fields = knowledgeFields(
      item({
        type: "pricing",
        price_statement: "Starting at $50",
        currency: "USD",
        content: "Two revisions included.",
      }),
    );
    const result = convertKnowledgeType(fields, "faq")!;
    expect(result.title).toBe(fields.title);
    expect(result.content).toContain("Starting at $50");
    expect(result.content).toContain("USD");
    expect(result.content).toContain("Two revisions included.");
    expect(result.price_statement).toBe("");
    expect(result.currency).toBe("");
    expect(fields.price_statement).toBe("Starting at $50");
  });
  it("preserves service details and a pricing note as visible text in another type", () => {
    const fields = knowledgeFields(
      item({
        type: "service",
        details: joinServiceDetails("Two revisions.", "Quoted individually."),
      }),
    );
    const result = convertKnowledgeType(fields, "policy")!;
    expect(result.content).toContain(fields.content);
    expect(result.content).toContain("Two revisions.");
    expect(result.content).toContain("Quoted individually.");
    expect(result.details).toBe("");
  });
  it("blocks a conversion that cannot retain all text within the target limit", () => {
    const fields = knowledgeFields(item({ content: "x".repeat(5000) }));
    expect(convertKnowledgeType(fields, "service")).toBeNull();
    expect(fields.content).toHaveLength(5000);
  });
  it("never truncates combined structured fields to make a conversion fit", () => {
    const fields = knowledgeFields(
      item({
        type: "pricing",
        content: "x".repeat(6000),
        price_statement: "Contact us",
      }),
    );
    expect(convertKnowledgeType(fields, "custom_note")).toBeNull();
  });
  it("round-trips legacy service details and the two optional sections", () => {
    for (const details of [
      "Legacy details\nAll intact.",
      "Pricing note:\nContact us.",
      "Additional facts\n\nPricing note:\nQuoted individually.",
    ]) {
      const fields = splitServiceDetails(details);
      expect(joinServiceDetails(fields.additional, fields.pricingNote)).toBe(
        details,
      );
    }
  });
  it("keeps unchanged generic content and collection when switching compatible types", () => {
    const fields = knowledgeFields(item({ collection_id: "collection" }));
    expect(convertKnowledgeType(fields, "faq")).toEqual({
      ...fields,
      type: "faq",
    });
  });
  it("reads service sections with browser multipart line endings without changing the stored text", () => {
    const details =
      "Two revisions.\r\n\r\nPricing note:\r\nQuoted individually.";
    const fields = knowledgeFields(item({ type: "service", details }));
    expect(splitServiceDetails(fields.details)).toEqual({
      additional: "Two revisions.",
      pricingNote: "Quoted individually.",
    });
    expect(fields.details).toBe(details);
    expect(splitServiceDetails("Pricing note:\r\nContact us.")).toEqual({
      additional: "",
      pricingNote: "Contact us.",
    });
  });
});
it("renders readable last-updated metadata", () => {
  const now = Date.parse("2026-10-20T10:00:00Z");
  expect(knowledgeUpdatedLabel("2026-10-20T10:00:00Z", now)).toBe(
    "Updated just now",
  );
  expect(knowledgeUpdatedLabel("2026-10-20T09:00:00Z", now)).toBe(
    "Updated 1 hr ago",
  );
  expect(knowledgeUpdatedLabel("2026-10-19T09:00:00Z", now)).toBe(
    "Updated yesterday",
  );
});
