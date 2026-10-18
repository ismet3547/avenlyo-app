import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "text-field flex min-h-28 w-full rounded-lg border border-input bg-white p-3.5 text-sm leading-6 transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary disabled:bg-muted disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
