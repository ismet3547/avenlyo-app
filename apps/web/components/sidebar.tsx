"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Cable,
  FlaskConical,
  House,
  Inbox,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";
const groups = [
  {
    label: "Workspace",
    links: [
      { href: "/app", label: "Home", icon: House },
      { href: "/app/inbox", label: "Inbox", icon: Inbox },
      { href: "/app/leads", label: "Leads", icon: UsersRound },
    ],
  },
  {
    label: "Build your agent",
    links: [
      { href: "/app/agent", label: "Agent", icon: Sparkles },
      { href: "/app/knowledge", label: "Knowledge", icon: BookOpen },
      { href: "/app/channels", label: "Channels", icon: Cable },
    ],
  },
];
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <div className="sidebar-content">
      <div className="px-3 pb-9 pt-1" onClick={onNavigate}>
        <Brand />
      </div>
      <nav aria-label="Main navigation" className="space-y-8">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="nav-label">{group.label}</p>
            <div className="space-y-1">
              {group.links.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/app"
                    ? path === href
                    : path.startsWith(href) ||
                      (href === "/app/agent" &&
                        (path.startsWith("/app/test-agent") ||
                          path.startsWith("/app/conversations")));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn("nav-link", active && "nav-link-active")}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-[18px]"
                      strokeWidth={1.7}
                    />
                    {label}
                    {active && (
                      <span
                        className="ml-auto size-1.5 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto space-y-5 pt-10">
        <Link
          href="/app/test-agent"
          onClick={onNavigate}
          className="agent-shortcut group"
        >
          <span className="flex items-center justify-between">
            <FlaskConical className="size-4 text-primary" aria-hidden="true" />
            <ArrowUpRight
              className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
          <span className="mt-3 block text-[13px] font-semibold">
            A little practice goes a long way.
          </span>
          <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
            Try your agent before your customers do.
          </span>
          <span className="mt-3 block text-xs font-semibold text-primary">
            Open Test Agent
          </span>
        </Link>
        <Link
          href="/app/settings"
          onClick={onNavigate}
          aria-current={path.startsWith("/app/settings") ? "page" : undefined}
          className={cn(
            "nav-link",
            path.startsWith("/app/settings") && "nav-link-active",
          )}
        >
          <Settings2
            className="size-[18px]"
            aria-hidden="true"
            strokeWidth={1.7}
          />
          Settings
        </Link>
        <p className="px-3 text-[11px] text-muted-foreground">
          Your knowledge. A more helpful front office.
        </p>
      </div>
    </div>
  );
}
