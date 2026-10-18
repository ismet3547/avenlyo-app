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
        "inline-flex max-w-full items-center gap-1.5 rounded-[4px] border border-border bg-transparent px-1.5 py-0.5 text-[11px] font-normal leading-4 text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
