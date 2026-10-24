"use client";
import { useId, useRef, type ComponentProps, type ReactNode } from "react";
import { Button } from "./ui/button";

export function ConfirmButton({ title, description, confirmLabel, children, onConfirm, name, value, ...props }: {
  title: string;
  description: string;
  confirmLabel: string;
  children: ReactNode;
  onConfirm?: () => void;
  name?: string;
  value?: string;
} & Omit<ComponentProps<typeof Button>, "onClick" | "children" | "name" | "value">) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submit = useRef<HTMLButtonElement>(null);
  const id = useId();
  return (
    <>
      <Button {...props} type="button" onClick={() => dialog.current?.showModal()}>{children}</Button>
      {name && <button hidden ref={submit} type="submit" name={name} value={value} disabled={props.disabled} />}
      <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-white p-6 text-foreground shadow-xl backdrop:bg-slate-950/40" onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
        <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
        <p id={`${id}-description`} className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" autoFocus onClick={() => dialog.current?.close()}>Cancel</Button>
          <Button type="button" variant={props.variant === "destructive" ? "destructive" : "default"} disabled={props.disabled} onClick={() => {
            dialog.current?.close();
            if (onConfirm) onConfirm();
            else submit.current?.click();
          }}>{confirmLabel}</Button>
        </div>
      </dialog>
    </>
  );
}
