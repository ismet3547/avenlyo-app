"use client";
import type { FormState } from "@/app/auth/actions";
import { useActionState } from "react";
import { saveCollection } from "@/app/app/knowledge/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
export function KnowledgeCollectionForm({
  id,
  name,
}: {
  id?: string;
  name?: string;
}) {
  const [state, action, pending] = useActionState(saveCollection, {
    status: "idle",
    message: "",
  } as FormState);
  return (
    <details className="knowledge-collection-form">
      <summary>{id ? "Rename collection" : "+ Create collection"}</summary>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={id ?? ""} />
        <label
          className="block font-medium"
          htmlFor={`collection-name-${id ?? "new"}`}
        >
          Collection name
        </label>
        <Input
          id={`collection-name-${id ?? "new"}`}
          name="name"
          defaultValue={name}
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. Sales FAQs"
        />
        <Button disabled={pending} size="sm">
          {pending ? "Saving…" : id ? "Save name" : "Create collection"}
        </Button>
        {state.message && (
          <p
            role="status"
            className={
              state.status === "error" ? "text-danger" : "text-success"
            }
          >
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}
