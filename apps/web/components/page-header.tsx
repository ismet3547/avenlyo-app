import type { ReactNode } from "react";
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </header>
  );
}
