"use client";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./ui/button";
export function PendingButton({
  pendingText,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={pending || disabled} type="submit">
      {pending ? pendingText : children}
    </Button>
  );
}
