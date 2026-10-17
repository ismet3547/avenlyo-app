import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Badge({
  className,
  children,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & {
  tone?: "neutral" | "success" | "attention" | "danger" | "test";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium leading-5",
        tone === "success"
          ? "border-success/15 bg-success-soft text-success"
          : tone === "attention"
            ? "border-attention/15 bg-attention-soft text-attention"
            : tone === "danger"
              ? "border-danger/15 bg-danger-soft text-danger"
              : tone === "test"
                ? "border-border bg-transparent text-muted-foreground"
                : "border-border bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    >
      {tone !== "test" && (
        <span
          aria-hidden
          className="size-1 rounded-full bg-current opacity-65"
        />
      )}
      {children}
    </span>
  );
}
