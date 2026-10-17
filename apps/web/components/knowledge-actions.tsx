"use client";
import { useActionState } from "react";
import { knowledgeOperation } from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
export function KnowledgeActions({
  id,
  status,
}: {
  id: string;
  status: "draft" | "published" | "archived";
}) {
  const [state, action, pending] = useActionState(knowledgeOperation, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <div className="mt-4">
      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="id" value={id} />
        {status !== "published" ? (
          <Button size="sm" name="intent" value="publish" disabled={pending}>
            Publish
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            name="intent"
            value="draft"
            disabled={pending}
          >
            Unpublish
          </Button>
        )}
        {status !== "archived" && (
          <Button
            size="sm"
            variant="ghost"
            name="intent"
            value="archived"
            disabled={pending}
          >
            Archive
          </Button>
        )}
        <details className="self-center">
          <summary className="cursor-pointer px-2 text-xs text-muted-foreground">
            Delete
          </summary>
          <span className="mt-2 inline-flex items-center gap-2 rounded-lg border border-danger/15 bg-danger-soft p-2 text-xs text-danger">
            Permanently delete?
            <Button
              size="sm"
              variant="destructive"
              name="intent"
              value="delete"
              disabled={pending}
            >
              Confirm delete
            </Button>
          </span>
        </details>
      </form>
      {state.message && (
        <p
          role="status"
          className={`mt-3 text-xs ${state.status === "error" ? "text-danger" : "text-success"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
