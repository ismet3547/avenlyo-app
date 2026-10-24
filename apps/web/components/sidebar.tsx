"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  UsersRound,
  MessageSquare,
  Sparkles,
  BookOpen,
  Cable,
  Settings,
  FlaskConical,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
const nav = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/inbox", label: "Inbox", icon: Inbox },
  { href: "/app/leads", label: "Leads", icon: UsersRound },
  { href: "/app/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/app/agent", label: "Agent", icon: Sparkles },
  { href: "/app/test-agent", label: "Test Agent", icon: FlaskConical },
  { href: "/app/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/app/channels", label: "Channels", icon: Cable },
  { href: "/app/settings", label: "Settings", icon: Settings },
];
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <>
      <Link
        href="/app"
        onClick={onNavigate}
        className="mb-8 flex items-center gap-2.5 px-3 text-xl font-semibold tracking-tight"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-white">
          <Sparkles className="size-4" aria-hidden />
        </span>
        Avenlyo
      </Link>
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">
        Workspace
      </p>
      <nav aria-label="Main navigation" className="space-y-1">
        {nav.map(({ href, label, icon: Icon }, i) => {
          const active =
            href === "/app"
              ? path === href
              : path === href || path.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              onClick={onNavigate}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                active ? "bg-[#efeffd] text-primary" : "text-muted-foreground",
                i === 4 && "mt-6",
              )}
            >
              <Icon aria-hidden className="size-[17px]" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-8">
        <Link
          href="/app/test-agent"
          onClick={onNavigate}
          className="block rounded-xl border border-border bg-gradient-to-b from-white to-muted p-4"
        >
          <span className="flex items-center justify-between text-sm font-semibold">
            Meet your agent
            <ArrowUpRight
              className="size-4 text-muted-foreground"
              aria-hidden
            />
          </span>
          <span className="mt-2 block text-xs leading-5 text-muted-foreground">
            Try a customer question before connecting channels.
          </span>
        </Link>
      </div>
    </>
  );
}
