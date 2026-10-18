"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Cable,
  FlaskConical,
  House,
  Inbox,
  Settings2,
  SlidersHorizontal,
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
    label: "Agent",
    links: [
      { href: "/app/agent", label: "Agent", icon: SlidersHorizontal },
      { href: "/app/knowledge", label: "Knowledge", icon: BookOpen },
      { href: "/app/channels", label: "Channels", icon: Cable },
    ],
  },
];
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <div className="sidebar-content">
      <div className="px-2 pb-8 pt-1" onClick={onNavigate}>
        <Brand />
      </div>
      <nav aria-label="Main navigation" className="space-y-7">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="nav-label">{group.label}</p>
            <div className="space-y-1">
              {group.links.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/app" ? path === href : path.startsWith(href);
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
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto border-t border-border pt-4">
        <Link
          href="/app/test-agent"
          onClick={onNavigate}
          className={cn(
            "nav-link",
            (path.startsWith("/app/test-agent") ||
              path.startsWith("/app/conversations")) &&
              "nav-link-active",
          )}
          aria-current={path === "/app/test-agent" ? "page" : undefined}
        >
          <FlaskConical
            className="size-[17px]"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          Test Agent
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
            className="size-[17px]"
            aria-hidden="true"
            strokeWidth={1.6}
          />
          Workspace settings
        </Link>
      </div>
    </div>
  );
}
