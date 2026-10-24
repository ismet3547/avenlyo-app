"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { knowledgeOperation } from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { ConfirmButton } from "./confirm-button";
import { FormFeedback } from "./form-feedback";
export function KnowledgeActions({
  id,
  status,
  workspaceId,
}: {
  id: string;
  workspaceId: string;
  status: "draft" | "published" | "archived";
}) {
  const [state, action, pending] = useActionState(knowledgeOperation, {
    message: "",
    status: "idle",
  } as FormState);
  const [intent, setIntent] = useState("");
  return (
    <div className="mt-4">
      <form
        action={action}
        className="flex flex-wrap gap-2"
        onSubmit={(event) =>
          setIntent(
            (event.nativeEvent as SubmitEvent).submitter?.getAttribute(
              "value",
            ) ?? "",
          )
        }
      >
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="id" value={id} />
        {status !== "published" ? (
          <Button size="sm" name="intent" value="publish" disabled={pending}>
            {pending && intent === "publish" ? "Publishing…" : "Publish"}
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
          <ConfirmButton
            size="sm"
            variant="ghost"
            name="intent"
            value="archived"
            disabled={pending}
            title="Archive this knowledge?"
            description="Your agent will stop using this item. You can review and publish it again from Archived items."
            confirmLabel="Archive item"
          >
            Archive
          </ConfirmButton>
        )}
        <ConfirmButton
          size="sm"
          variant="destructive"
          name="intent"
          value="delete"
          disabled={pending}
          title="Permanently delete this item?"
          description="This removes the knowledge and makes it unavailable to your agent. This cannot be undone."
          confirmLabel="Confirm delete"
        >
          Delete
        </ConfirmButton>
      </form>
      {pending && (
        <p
          role="status"
          className="mt-3 text-xs leading-5 text-muted-foreground"
        >
          {intent === "publish"
            ? "Preparing knowledge for your agent. Keep this page open until publication is confirmed."
            : "Updating knowledge…"}
        </p>
      )}
      {!pending && <FormFeedback state={state} className="mt-3" />}
      {!pending && state.status === "success" && intent === "publish" && (
        <Link
          href="/app/test-agent"
          className="mt-3 inline-block text-sm font-medium text-primary underline"
        >
          Test published knowledge →
        </Link>
      )}
    </div>
  );
}
