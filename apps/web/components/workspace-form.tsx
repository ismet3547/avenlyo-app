"use client";
import { useActionState } from "react";
import { createWorkspace } from "@/app/workspaces/actions";
import type { FormState } from "@/app/auth/actions";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        Business name
        <Input
          className="mt-2"
          name="name"
          placeholder="e.g. Northstar Studio"
          minLength={2}
          maxLength={100}
          required
        />
      </label>
      <p className="text-xs leading-5 text-muted-foreground">
        No website or external channel is required. You can add knowledge
        manually.
      </p>
      {state.message && (
        <p role="status" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <Button disabled={pending} type="submit">
        {pending ? "Creating…" : "Create workspace"}
      </Button>
    </form>
  );
}
