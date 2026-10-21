import {
  businessKnowledgeType,
  type KnowledgeItem,
  type KnowledgeType,
} from "@avenlyo-app/shared";
export type KnowledgeFields = {
  type: KnowledgeType;
  title: string;
  content: string;
  price_statement: string;
  currency: string;
  details: string;
  collection_id: string;
};
export const knowledgeFieldLabels: Record<KnowledgeType, [string, string]> = {
  service: ["Service name", "Description"],
  pricing: ["Pricing title", "Details"],
  faq: ["Question", "Answer"],
  policy: ["Policy name", "Policy"],
  business_info: ["Topic", "Information"],
  custom_note: ["Title", "Note"],
};
export function knowledgeFields(
  item?: KnowledgeItem,
  type: KnowledgeType = "custom_note",
): KnowledgeFields {
  return {
    type: item ? businessKnowledgeType(item.type) : type,
    title: item?.title ?? "",
    content: item?.content ?? "",
    price_statement: item?.price_statement ?? "",
    currency: item?.currency ?? "",
    details: item?.details ?? "",
    collection_id: item?.collection_id ?? "",
  };
}
// Optional service sections share the existing plain-text details field.
const pricingNoteSeparator = "\n\nPricing note:\n";
export function splitServiceDetails(details: string) {
  // Multipart form submissions may persist CRLF line endings. Read both
  // representations without rewriting the stored field on an unchanged save.
  const leading = details.match(/^Pricing note:\r?\n/);
  if (leading)
    return {
      additional: "",
      pricingNote: details.slice(leading[0].length),
    };
  const separator = [...details.matchAll(/(?:\r?\n){2}Pricing note:\r?\n/g)].at(
    -1,
  );
  return !separator
    ? { additional: details, pricingNote: "" }
    : {
        additional: details.slice(0, separator.index),
        pricingNote: details.slice(separator.index + separator[0].length),
      };
}
export function joinServiceDetails(additional: string, pricingNote: string) {
  if (!pricingNote) return additional;
  return additional
    ? `${additional}${pricingNoteSeparator}${pricingNote}`
    : `Pricing note:\n${pricingNote}`;
}
export function convertKnowledgeType(
  fields: KnowledgeFields,
  type: KnowledgeType,
): KnowledgeFields | null {
  let content = fields.content;
  if (fields.type === "pricing" && type !== "pricing")
    content = [
      fields.price_statement && `Price: ${fields.price_statement}`,
      fields.currency && `Currency: ${fields.currency}`,
      content,
    ]
      .filter(Boolean)
      .join("\n\n");
  if (fields.type === "service" && type !== "service" && fields.details)
    content = [content, `Additional details:\n${fields.details}`]
      .filter(Boolean)
      .join("\n\n");
  if (content.length > (type === "service" ? 4000 : 6000)) return null;
  return {
    ...fields,
    type,
    content,
    price_statement: type === "pricing" ? fields.price_statement : "",
    currency: type === "pricing" ? fields.currency : "",
    details: type === "service" ? fields.details : "",
  };
}
export function filterKnowledge(
  items: KnowledgeItem[],
  filters: {
    archived?: boolean;
    status?: string;
    query?: string;
    type?: string;
    collection?: string;
  },
) {
  return items.filter(
    (item) =>
      (filters.archived
        ? item.status === "archived"
        : item.status !== "archived") &&
      (!filters.status ||
        filters.status === "all" ||
        item.status === filters.status) &&
      (!filters.type || businessKnowledgeType(item.type) === filters.type) &&
      (!filters.collection || item.collection_id === filters.collection) &&
      `${item.title} ${item.content} ${item.price_statement} ${item.currency}`
        .toLowerCase()
        .includes((filters.query ?? "").trim().toLowerCase()),
  );
}
export function knowledgeUpdatedLabel(value: string, now: number) {
  const elapsed = Math.max(0, now - Date.parse(value));
  if (elapsed < 60_000) return "Updated just now";
  if (elapsed < 3_600_000)
    return `Updated ${Math.floor(elapsed / 60_000)} min ago`;
  if (elapsed < 86_400_000)
    return `Updated ${Math.floor(elapsed / 3_600_000)} hr ago`;
  if (elapsed < 172_800_000) return "Updated yesterday";
  return `Updated ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value))}`;
}
