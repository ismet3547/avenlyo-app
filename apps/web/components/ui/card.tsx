import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-border bg-card text-card-foreground shadow-[var(--shadow-panel)]",
        className,
      )}
      {...props}
    />
  );
}
