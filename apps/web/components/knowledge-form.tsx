"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import {
  businessKnowledgeType,
  knowledgeLabels,
  type KnowledgeItem,
  type KnowledgeCollection,
  type KnowledgeType,
} from "@avenlyo-app/shared";
import { saveKnowledge } from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { KnowledgeIcon, KnowledgeTypeChoices } from "./knowledge-types";
import { KnowledgeCollectionForm } from "./knowledge-collection-form";
const fields: Record<
  KnowledgeType,
  { title: string; content: string; placeholder: string; body: string }
> = {
  service: {
    title: "Service name",
    content: "Description",
    placeholder: "Logo design",
    body: "Describe the service and what is included.",
  },
  pricing: {
    title: "Pricing title",
    content: "Details / conditions",
    placeholder: "Logo design pricing",
    body: "What is included? Any conditions or limits?",
  },
  faq: {
    title: "Question",
    content: "Answer",
    placeholder: "Do you work with small businesses?",
    body: "Write a clear answer customers can rely on.",
  },
  policy: {
    title: "Policy title",
    content: "Policy details",
    placeholder: "Revisions and refunds",
    body: "Explain the rule and any exceptions.",
  },
  business_info: {
    title: "Title / category",
    content: "Information",
    placeholder: "Opening hours",
    body: "Add current business facts.",
  },
  custom_note: {
    title: "Title",
    content: "Content",
    placeholder: "Additional business information",
    body: "Add information customers should know.",
  },
};
export function KnowledgeForm({
  item,
  collections,
  initialType,
  initialCollection,
}: {
  item?: KnowledgeItem;
  collections: KnowledgeCollection[];
  initialType?: KnowledgeType;
  initialCollection?: string;
}) {
  const [type, setType] = useState<KnowledgeType | undefined>(
    item ? businessKnowledgeType(item.type) : initialType,
  );
  const [choosing, setChoosing] = useState(!type);
  const [collection, setCollection] = useState(
    item?.collection_id ?? initialCollection ?? "",
  );
  const [state, action, pending] = useActionState(saveKnowledge, {
    message: "",
    status: "idle",
  } as FormState);
  useEffect(() => {
    if (type && !choosing) document.getElementById("knowledge-title")?.focus();
  }, [type, choosing]);
  const f = type ? fields[type] : undefined;
  return (
    <div className="knowledge-editor-layout">
      <form action={action} className="knowledge-editor">
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <input type="hidden" name="revision" value={item?.revision ?? ""} />
        {choosing ? (
          <fieldset className="knowledge-picker-panel">
            <legend className="text-lg font-semibold">
              What would you like Avenlyo to know?
            </legend>
            <KnowledgeTypeChoices
              selected={type}
              onChange={(value) => {
                setType(value);
                setChoosing(false);
              }}
            />
          </fieldset>
        ) : (
          type && (
            <div className="knowledge-selected-type">
              <span className="flex items-center gap-3 font-semibold">
                <KnowledgeIcon type={type} />
                {knowledgeLabels[type]}
                <Check aria-hidden className="size-4" />
              </span>
              <button type="button" onClick={() => setChoosing(true)}>
                Change type <ChevronDown aria-hidden className="size-4" />
              </button>
              <input type="hidden" name="type" value={type} />
            </div>
          )
        )}
        {type && f && (
          <div className="knowledge-fields">
            <label htmlFor="knowledge-title">
              {f.title}
              <Input
                id="knowledge-title"
                name="title"
                defaultValue={item?.title}
                required
                minLength={3}
                maxLength={180}
                placeholder={f.placeholder}
              />
            </label>
            {type === "pricing" && (
              <section
                className="knowledge-price-fields"
                aria-label="Pricing information"
              >
                <div className="knowledge-price-heading">
                  <KnowledgeIcon type="pricing" />
                  <h2>Pricing information</h2>
                </div>
                <div className="knowledge-price-grid">
                  <label htmlFor="knowledge-price">
                    Price / pricing statement
                    <Input
                      id="knowledge-price"
                      name="price_statement"
                      defaultValue={item?.price_statement}
                      required
                      maxLength={240}
                      placeholder="Starting at $50"
                      aria-describedby="pricing-examples"
                    />
                  </label>
                  <label htmlFor="knowledge-currency">
                    Currency <span className="font-normal">(optional)</span>
                    <Input
                      id="knowledge-currency"
                      name="currency"
                      defaultValue={item?.currency}
                      maxLength={3}
                      pattern="[A-Z]{3}|"
                      placeholder="USD"
                    />
                  </label>
                </div>
                <p id="pricing-examples">
                  $50 · Starting at $50 · $50–$100 · Contact us for pricing
                </p>
              </section>
            )}
            <label htmlFor="knowledge-content">
              {f.content}
              {type === "pricing" && (
                <span className="font-normal"> (optional)</span>
              )}
              <Textarea
                id="knowledge-content"
                name="content"
                defaultValue={item?.content}
                required={type !== "pricing"}
                minLength={type === "pricing" ? undefined : 3}
                maxLength={type === "service" ? 4000 : 6000}
                placeholder={f.body}
                className="min-h-52"
              />
            </label>
            {type === "service" && (
              <label htmlFor="knowledge-details">
                Details / limits <span className="font-normal">(optional)</span>
                <Textarea
                  id="knowledge-details"
                  name="details"
                  defaultValue={item?.details}
                  maxLength={2000}
                  placeholder="Delivery, exclusions or service limits"
                  className="min-h-28"
                />
              </label>
            )}
            <label htmlFor="knowledge-collection">
              Collection
              <select
                id="knowledge-collection"
                name="collection_id"
                value={collection}
                onChange={(event) => setCollection(event.target.value)}
              >
                <option value="">Unfiled</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {type && (
          <footer className="knowledge-editor-footer">
            <Button variant="ghost" asChild>
              <Link href="/app/knowledge">
                <ArrowLeft aria-hidden />
                Cancel
              </Link>
            </Button>
            <Button disabled={pending}>
              {pending ? "Saving…" : "Save draft"}
            </Button>
          </footer>
        )}
        {state.message && (
          <p role="alert" className="mt-4 text-danger">
            {state.message}
          </p>
        )}
      </form>
      <aside
        className="knowledge-editor-context"
        aria-label="Knowledge details"
      >
        <h2>Publication</h2>
        <span
          className="status-text"
          data-tone={item?.status === "published" ? "success" : "attention"}
        >
          {item?.status
            ? item.status[0].toUpperCase() + item.status.slice(1)
            : "New draft"}
        </span>
        <p>
          {item?.status === "published"
            ? "Saving changes returns this item to Draft. Publish again when ready."
            : "Save a draft, then review and publish from Knowledge."}
        </p>
        <div className="knowledge-availability">
          <Check aria-hidden className="size-4" />
          <p>Available to customers after publishing.</p>
        </div>
        <div className="knowledge-context-organization">
          <h2>Organization</h2>
          <p>
            {collection
              ? collections.find((c) => c.id === collection)?.name
              : "No collection selected"}
          </p>
          <KnowledgeCollectionForm />
        </div>
      </aside>
    </div>
  );
}
