import Link from "next/link";
import { channelLabels } from "@avenlyo-app/shared";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Brand() {
  return <span className="brand">Avenlyo</span>;
}
export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function ActionLink({
  href,
  children,
  secondary = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link
      className={`button button-${secondary ? "secondary" : "primary"} ${className}`}
      href={href}
    >
      {children}
    </Link>
  );
}
export function Badge({
  children,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "accent" | "danger";
  dot?: boolean;
}) {
  return <span className="badge">{children}</span>;
}
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-header">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: "messages" | "knowledge" | "help";
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function ChannelLabel({ channel }: { channel: string }) {
  const label = channelLabels[channel as keyof typeof channelLabels] ?? channel;
  return <span className="small">{label}</span>;
}
