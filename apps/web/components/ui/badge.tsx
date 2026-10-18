import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Badge({
  className,
  children,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border border-border/70 bg-muted/70 px-2 py-1 text-[11px] font-medium leading-4 text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
