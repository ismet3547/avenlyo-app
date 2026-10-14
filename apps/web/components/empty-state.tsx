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
    <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-10 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-xl border border-border bg-muted">
        <MessageSquare aria-hidden className="size-5 text-muted-foreground" />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
