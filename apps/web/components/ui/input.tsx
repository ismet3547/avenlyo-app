import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-white px-3.5 text-sm transition-colors placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary disabled:bg-muted disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
