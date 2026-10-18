import type { ReactNode } from "react";
import { Sprout } from "lucide-react";
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-white px-6 py-12 text-center">
      <span className="mb-5 grid size-14 place-items-center rounded-2xl border border-border bg-muted/50">
        <Sprout aria-hidden className="size-6 text-primary" strokeWidth={1.4} />
      </span>
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
