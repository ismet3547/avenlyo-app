"use client";
import { useActionState } from "react";
import { renameBusiness } from "@/app/app/settings/actions";
import type { FormState } from "@/app/auth/actions";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function BusinessForm({
  name,
  editable,
}: {
  name: string;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(renameBusiness, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form action={action}>
      <label htmlFor="business-name" className="text-sm font-medium">
        Business name
      </label>
      <Input
        className="mt-2"
        id="business-name"
        name="name"
        defaultValue={name}
        minLength={2}
        maxLength={100}
        required
        disabled={!editable}
      />
      <Button className="mt-5" disabled={pending || !editable} type="submit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
      {state.message && (
        <p
          role="status"
          className={`mt-4 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
