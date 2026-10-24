"use client";
import { useActionState, useState } from "react";
import { renameBusiness } from "@/app/app/settings/actions";
import type { FormState } from "@/app/auth/actions";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { FormFeedback } from "./form-feedback";
export function BusinessForm({
  name,
  editable,
  workspaceId,
}: {
  name: string;
  editable: boolean;
  workspaceId: string;
}) {
  const [state, action, pending] = useActionState(renameBusiness, {
    message: "",
    status: "idle",
  } as FormState);
  const [changed, setChanged] = useState(false);
  const [value, setValue] = useState(name);
  return (
    <form
      action={action}
      onChange={() => setChanged(true)}
      onSubmit={() => setChanged(false)}
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label htmlFor="business-name" className="text-sm font-medium">
        Business name
      </label>
      <Input
        className="mt-2"
        id="business-name"
        name="name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        minLength={2}
        maxLength={100}
        required
        disabled={!editable || pending}
      />
      <Button className="mt-5" disabled={pending || !editable} type="submit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
      {changed && !pending && (
        <p className="text-xs font-medium text-amber-900">Unsaved changes</p>
      )}
      <FormFeedback
        state={
          (changed && state.status === "success") || pending
            ? { status: "idle", message: "" }
            : state
        }
        className="mt-4"
      />
    </form>
  );
}
