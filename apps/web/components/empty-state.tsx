import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
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
    <div className="flex min-h-60 flex-col items-center justify-center rounded-lg border border-border bg-white px-6 py-12 text-center">
      <span className="mb-5 grid size-14 place-items-center rounded-lg border border-border bg-muted/50">
        <Inbox aria-hidden className="size-6 text-primary" strokeWidth={1.4} />
      </span>
      <h2 className="text-base font-medium tracking-tight">{title}</h2>
      <p className="mt-3 max-w-md text-[13px] leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
