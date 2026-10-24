"use client";
import { useActionState } from "react";
import { switchWorkspace } from "@/app/workspaces/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { FormFeedback } from "./form-feedback";
export function WorkspaceSwitcher({
  workspaces,
  currentId,
}: {
  workspaces: { id: string; name: string }[];
  currentId: string;
}) {
  const [state, action, pending] = useActionState(switchWorkspace, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <div className="min-w-0 flex-1 sm:flex-none">
      <form
        action={action}
        className="flex min-w-0 items-center gap-2"
        aria-busy={pending}
      >
        <label
          htmlFor="workspace-select"
          className="text-xs font-medium text-muted-foreground"
        >
          Workspace
        </label>
        <select
          key={currentId}
          id="workspace-select"
          name="workspaceId"
          defaultValue={currentId}
          disabled={pending}
          className="h-11 min-w-0 max-w-full flex-1 rounded-lg border border-border bg-white px-2 text-sm font-semibold sm:max-w-52"
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {workspaces.length > 1 && (
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {pending ? "Switching…" : "Switch"}
          </Button>
        )}
      </form>
      <FormFeedback state={state} className="mt-2" />
    </div>
  );
}
export function WorkspaceButton({
  workspace,
  current,
}: {
  workspace: { id: string; name: string };
  current: boolean;
}) {
  const [state, action, pending] = useActionState(switchWorkspace, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form action={action}>
      <input type="hidden" name="workspaceId" value={workspace.id} />
      <Button
        type="submit"
        variant="outline"
        className="min-h-14 w-full justify-between whitespace-normal text-left"
        disabled={pending}
      >
        <span className="min-w-0 break-words">{workspace.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {pending ? "Opening…" : current ? "Current →" : "Open →"}
        </span>
      </Button>
      <FormFeedback state={state} className="mt-2" />
    </form>
  );
}
