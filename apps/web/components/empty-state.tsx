import type { ReactNode } from "react";
import { MessageSquare } from "lucide-react";
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
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-10 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-lg border border-border bg-success-soft">
        <MessageSquare aria-hidden className="size-5 text-primary" />
      </span>
      <h2 className="text-base font-medium tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
