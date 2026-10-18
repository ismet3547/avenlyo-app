"use client";
import { useActionState } from "react";
import { MoreHorizontal } from "lucide-react";
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
    <div>
      <form action={action} className="flex flex-wrap justify-end gap-2">
        <input type="hidden" name="id" value={id} />
        {status !== "published" && (
          <Button size="sm" name="intent" value="publish" disabled={pending}>
            {pending ? "Working…" : "Publish"}
          </Button>
        )}
        <details className="relative">
          <summary
            aria-label="More knowledge actions"
            className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </summary>
          <div className="absolute right-0 top-11 z-20 w-56 space-y-2 rounded-xl border border-border bg-white p-3 shadow-lg">
            {status === "published" && (
              <Button
                className="w-full justify-start"
                size="sm"
                variant="ghost"
                name="intent"
                value="draft"
                disabled={pending}
              >
                Unpublish
              </Button>
            )}
            {status !== "archived" && (
              <Button
                className="w-full justify-start"
                size="sm"
                variant="ghost"
                name="intent"
                value="archived"
                disabled={pending}
              >
                Archive
              </Button>
            )}
            <details className="border-t border-border pt-2">
              <summary className="rounded-lg px-3 py-2 text-xs text-red-700">
                Delete item…
              </summary>
              <div className="p-3">
                <p className="mb-3 text-xs leading-5 text-muted-foreground">
                  Permanently delete this item? This cannot be undone.
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  name="intent"
                  value="delete"
                  disabled={pending}
                >
                  Confirm delete
                </Button>
              </div>
            </details>
          </div>
        </details>
      </form>
      {state.message && (
        <p
          role="status"
          className={`mt-3 max-w-sm text-xs leading-5 ${state.status === "error" ? "text-red-700" : "text-primary"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
