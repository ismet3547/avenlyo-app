import Link from "next/link";
import { FlaskConical, History, SlidersHorizontal } from "lucide-react";
export function AgentNavigation({
  active,
}: {
  active: "settings" | "test" | "history";
}) {
  return (
    <nav className="filter-bar" aria-label="Agent navigation">
      {[
        {
          key: "settings",
          href: "/app/agent",
          label: "Settings",
          icon: SlidersHorizontal,
        },
        {
          key: "test",
          href: "/app/test-agent",
          label: "Test Agent",
          icon: FlaskConical,
        },
        {
          key: "history",
          href: "/app/conversations",
          label: "Test history",
          icon: History,
        },
      ].map(({ key, href, label, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={active === key ? "page" : undefined}
          className="filter-tab"
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
