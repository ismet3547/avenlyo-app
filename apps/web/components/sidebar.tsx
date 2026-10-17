"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  UsersRound,
  MessageSquare,
  SlidersHorizontal,
  BookOpen,
  Cable,
  Settings,
  ArrowUpRight,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
const groups = [
  {
    label: "Operations",
    items: [
      { href: "/app", label: "Overview", icon: LayoutDashboard },
      { href: "/app/inbox", label: "Inbox", icon: Inbox },
      { href: "/app/leads", label: "Leads", icon: UsersRound },
      {
        href: "/app/conversations",
        label: "Conversations",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Configure",
    items: [
      { href: "/app/agent", label: "Agent", icon: SlidersHorizontal },
      { href: "/app/knowledge", label: "Knowledge", icon: BookOpen },
      { href: "/app/channels", label: "Channels", icon: Cable },
    ],
  },
];
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/app" ? path === href : path.startsWith(href);
  const navClass = (href: string) =>
    cn(
      "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors hover:bg-sage/60",
      active(href)
        ? "bg-sage text-primary font-medium"
        : "text-muted-foreground",
    );
  return (
    <>
      <div className="px-3 pb-8 pt-2" onClick={onNavigate}>
        <Brand />
      </div>
      <nav aria-label="Main navigation" className="space-y-7">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="eyebrow mb-2 px-3">{group.label}</p>
            <div className="space-y-1">
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
      <div className="mt-auto space-y-3 pt-8">
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
          className="block rounded-md border border-border bg-card/70 p-3.5 transition-colors hover:bg-card"
        >
          <span className="flex items-center gap-2 text-[13px] font-medium">
            <Play aria-hidden className="size-3.5 text-primary" />
            Test agent
            <ArrowUpRight
              aria-hidden
              className="ml-auto size-3.5 text-muted-foreground"
            />
          </span>
          <span className="mt-2 block text-xs leading-5 text-muted-foreground">
            Try a question before your customers do.
          </span>
        </Link>
      </div>
    </>
  );
}
