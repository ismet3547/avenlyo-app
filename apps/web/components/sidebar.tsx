"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Inbox,
  UsersRound,
  SlidersHorizontal,
  BookOpen,
  Cable,
  Settings,
  Play,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
const groups = [
  {
    label: "Work",
    items: [
      { href: "/app/inbox", label: "Inbox", icon: Inbox },
      { href: "/app/leads", label: "Leads", icon: UsersRound },
    ],
  },
  {
    label: "AI front office",
    items: [
      { href: "/app/agent", label: "Agent", icon: SlidersHorizontal },
      { href: "/app/knowledge", label: "Knowledge", icon: BookOpen },
      { href: "/app/channels", label: "Channels", icon: Cable },
    ],
  },
];
export function Sidebar({
  onNavigate,
  workspaceName,
}: {
  onNavigate?: () => void;
  workspaceName: string;
}) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/app" ? path === href : path.startsWith(href);
  const navClass = (href: string) =>
    cn(
      "flex min-h-10 items-center gap-3 rounded-[5px] px-3 py-2 text-[13px] transition-colors hover:bg-sage/60",
      active(href)
        ? "bg-sage font-semibold text-primary"
        : "text-foreground/80",
    );
  return (
    <>
      <div className="px-3 pb-7 pt-2" onClick={onNavigate}>
        <Brand />
        <p className="mt-3 truncate text-xs text-muted-foreground">
          {workspaceName}
        </p>
      </div>
      <nav aria-label="Main navigation" className="space-y-7">
        <Link
          href="/app"
          onClick={onNavigate}
          aria-current={active("/app") ? "page" : undefined}
          className={navClass("/app")}
        >
          <House aria-hidden className="size-[17px]" />
          Home
        </Link>
        {groups.map((group) => (
          <div key={group.label}>
            <p className="eyebrow mb-2 px-3">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active(href) ? "page" : undefined}
                  className={navClass(href)}
                >
                  <Icon aria-hidden className="size-[17px]" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto space-y-1 pt-8">
        <Link
          href="/app/settings"
          onClick={onNavigate}
          aria-current={active("/app/settings") ? "page" : undefined}
          className={navClass("/app/settings")}
        >
          <Settings aria-hidden className="size-[17px]" />
          Settings
        </Link>
        <Link
          href="/app/test-agent"
          onClick={onNavigate}
          aria-current={path === "/app/test-agent" ? "page" : undefined}
          className={cn(navClass("/app/test-agent"), "text-primary")}
        >
          <Play aria-hidden className="size-[17px]" />
          Test agent
          <ArrowUpRight
            aria-hidden
            className="ml-auto size-3.5 text-muted-foreground"
          />
        </Link>
      </div>
    </>
  );
}
