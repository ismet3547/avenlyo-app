"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, HelpCircle, Save, Send } from "lucide-react";
import type { KnowledgeItem } from "@avenlyo-app/shared";
import { saveKnowledge } from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
export function KnowledgeForm({ item }: { item?: KnowledgeItem }) {
  const [type, setType] = useState(item?.type ?? "text");
  const [content, setContent] = useState(item?.content ?? "");
  const [state, action, pending] = useActionState(saveKnowledge, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form
      action={action}
      className="grid max-w-6xl items-start gap-7 xl:grid-cols-[minmax(0,1fr)_250px]"
    >
      <div>
        <Link
          href="/app/knowledge"
          className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to knowledge
        </Link>
        <Card className="space-y-7 p-5 sm:p-7">
          <input type="hidden" name="id" value={item?.id ?? ""} />
          <input type="hidden" name="revision" value={item?.revision ?? ""} />
          <fieldset disabled={pending}>
            <legend className="text-[13px] font-semibold">
              Knowledge type
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["text", "faq"] as const).map((t) => (
                <label className="option-card" key={t}>
                  <input
                    name="type"
                    type="radio"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                  />
                  <span>
                    <span className="block text-xs font-medium">
                      {t === "text"
                        ? "Text · services and information"
                        : "FAQ · question and answer"}
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
                      {t === "text"
                        ? "Explain an offering or a business detail."
                        : "Give a specific answer to a common question."}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label
            className="block text-[13px] font-medium"
            htmlFor="knowledge-title"
          >
            {type === "faq" ? "Question" : "Title"}
            <Input
              id="knowledge-title"
              name="title"
              className="mt-2.5"
              defaultValue={item?.title}
              required
              minLength={3}
              maxLength={180}
              disabled={pending}
              placeholder={
                type === "faq"
                  ? "Do you work with small businesses?"
                  : "e.g. Custom design services"
              }
            />
          </label>
          <div>
            <label
              className="text-[13px] font-medium"
              htmlFor="knowledge-content"
            >
              {type === "faq" ? "Answer" : "Content"}
            </label>
            <Textarea
              id="knowledge-content"
              name="content"
              className="mt-2.5 min-h-72"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength={3}
              maxLength={6000}
              disabled={pending}
              placeholder={
                type === "faq"
                  ? "Write the answer you would give a customer…"
                  : "Describe what your business offers, including important details and limits…"
              }
            />
            <p className="mt-2 text-right text-[11px] tabular-nums text-muted-foreground">
              {content.length.toLocaleString()} / 6,000 characters
            </p>
          </div>
          {item?.status === "published" && (
            <p className="form-message status-warning">
              Saving these changes returns this item to Draft. Your agent will
              stop using it until you publish it again.
            </p>
          )}
        </Card>
        <div className="save-bar">
          <Button variant="ghost" asChild>
            <Link href="/app/knowledge">Cancel</Link>
          </Button>
          <Button disabled={pending} type="submit">
            <Save aria-hidden />
            {pending ? "Saving…" : "Save draft"}
          </Button>
        </div>
        {state.message && (
          <p role="alert" className="form-message bg-red-50 text-red-700">
            {state.message}
          </p>
        )}
      </div>
      <aside className="rounded-xl border border-border bg-white p-5 xl:mt-9">
        <h2 className="text-sm font-semibold">From a draft to an answer</h2>
        <div className="mt-5 space-y-5">
          {[
            [
              FileText,
              "1. Write",
              "Use clear facts your team is comfortable sharing.",
            ],
            [
              HelpCircle,
              "2. Review",
              "Check the details. A saved draft stays private to your team.",
            ],
            [
              Send,
              "3. Publish",
              "Publish from Knowledge when it is ready for customer answers.",
            ],
          ].map(([Icon, title, text]) => {
            const StepIcon = Icon as typeof FileText;
            return (
              <div key={String(title)} className="flex gap-3">
                <StepIcon
                  className="mt-1 size-3.5 shrink-0 text-primary"
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-medium">{String(title)}</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {String(text)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </form>
  );
}
