import type { ReactNode } from "react";
export function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="form-section-head">
        <span aria-hidden className="form-section-number">
          {number}
        </span>
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="field-help mt-1">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
