import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleHelp,
  FileText,
  Globe2,
  Camera,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill="currentColor" />
        <path
          d="m9 22 7-13 7 13M12 18h8"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span>
          avenlyo<span className="brand-period">.</span>
        </span>
      )}
    </span>
  );
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
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "accent" | "danger";
  dot?: boolean;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="status-dot" />}
      {children}
    </span>
  );
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
  icon = "messages",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: "messages" | "knowledge" | "help";
}) {
  const Icon =
    icon === "knowledge"
      ? FileText
      : icon === "help"
        ? CircleHelp
        : MessageSquare;
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon aria-hidden="true" />
      </span>
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
export function ChannelIcon({ channel }: { channel: string }) {
  const Icon =
    channel === "instagram"
      ? Camera
      : channel === "test_agent"
        ? Sparkles
        : Globe2;
  return (
    <span className={`channel-icon channel-${channel}`}>
      <Icon aria-hidden="true" />
    </span>
  );
}
export function Avatar({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  return (
    <span
      className={`avatar ${small ? "avatar-small" : ""}`}
      aria-hidden="true"
    >
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function Step({
  done,
  number,
  title,
  description,
  href,
}: {
  done: boolean;
  number: number;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link className={`setup-step ${done ? "is-complete" : ""}`} href={href}>
      <span className="step-number">
        {done ? <Check aria-hidden="true" /> : number}
      </span>
      <span>
        <strong>{title}</strong>
        <span className="step-description">{description}</span>
      </span>
      <ArrowRight className="step-arrow" aria-hidden="true" />
    </Link>
  );
}
