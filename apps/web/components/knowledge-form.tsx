"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import type { KnowledgeItem } from "@avenlyo-app/shared";
import { saveKnowledge } from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { FormFeedback } from "./form-feedback";
export function KnowledgeForm({
  item,
  workspaceId,
}: {
  item?: KnowledgeItem;
  workspaceId: string;
}) {
  const [type, setType] = useState(item?.type ?? "text");
  const [title, setTitle] = useState(item?.title ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [state, action, pending] = useActionState(saveKnowledge, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form action={action} className="max-w-3xl">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <fieldset disabled={pending}>
        <Card className="space-y-6 p-5 sm:p-6">
          <input type="hidden" name="id" value={item?.id ?? ""} />
          <input type="hidden" name="revision" value={item?.revision ?? ""} />
          <fieldset>
            <legend className="text-sm font-semibold">Knowledge type</legend>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              {(["text", "faq"] as const).map((t) => (
                <label
                  className={`flex flex-1 items-center gap-3 rounded-lg border p-4 text-sm ${type === t ? "border-primary bg-[#f4f3ff] text-primary" : "border-border"}`}
                  key={t}
                >
                  <input
                    name="type"
                    type="radio"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="accent-primary"
                  />
                  {t === "text"
                    ? "Text · services and information"
                    : "FAQ · question and answer"}
                </label>
              ))}
            </div>
          </fieldset>
          <label
            className="block text-sm font-medium"
            htmlFor="knowledge-title"
          >
            {type === "faq" ? "Question" : "Title"}
            <Input
              id="knowledge-title"
              name="title"
              className="mt-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={3}
              maxLength={180}
              placeholder={
                type === "faq"
                  ? "Do you work with small businesses?"
                  : "Custom design services"
              }
            />
          </label>
          <label
            className="block text-sm font-medium"
            htmlFor="knowledge-content"
          >
            {type === "faq" ? "Answer" : "Content"}
            <Textarea
              id="knowledge-content"
              name="content"
              className="mt-2 min-h-56"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              minLength={3}
              maxLength={6000}
              placeholder={
                type === "faq"
                  ? "Yes. Share your project scope and we can discuss suitable options."
                  : "Describe what your business offers, including any important limits or details."
              }
            />
          </label>
          <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
            Saved items are drafts. Review and publish from Knowledge before
            your agent can use them. Editing a published item returns it to
            Draft.
          </p>
        </Card>
      </fieldset>
      {item?.status === "published" && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <strong>Saving unpublishes this item.</strong> Your agent will stop
          using it until you review and publish the updated draft.
        </p>
      )}
      <div className="mt-5 flex items-center gap-4">
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save draft"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/app/knowledge">Cancel</Link>
        </Button>
      </div>
      <FormFeedback state={state} className="mt-4" />
    </form>
  );
}
