"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronsUpDown,
  FlaskConical,
  House,
  Inbox,
  LogOut,
  Menu,
  Network,
  Settings2,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { switchWorkspace } from "@/app/workspaces/actions";
import { Brand, Avatar, Badge } from "./ui";
import { screenHref } from "@/lib/presentation";
const groups = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Overview", href: "/app", icon: House },
      { label: "Inbox", href: "/app/inbox", icon: Inbox },
      { label: "Leads", href: "/app/leads", icon: UsersRound },
    ],
  },
  {
    label: "YOUR AI",
    items: [
      { label: "Agent", href: "/app/agent", icon: Sparkles },
      { label: "Knowledge", href: "/app/knowledge", icon: BookOpen },
      { label: "Channels", href: "/app/channels", icon: Network },
    ],
  },
];
type Props = {
  children: ReactNode;
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string }[];
  email: string;
  role: string;
  preview?: boolean;
  activePath?: string;
};
export function AppShell({
  children,
  workspace,
  workspaces,
  email,
  role,
  preview = false,
  activePath,
}: Props) {
  const pathname = usePathname();
  const current = activePath ?? pathname;
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const active = (href: string) =>
    href === "/app" ? current === href : current.startsWith(href);
  const label =
    [
      ...groups.flatMap((g) => g.items),
      { label: "Settings", href: "/app/settings" },
      { label: "Test agent", href: "/app/test-agent" },
      { label: "Test history", href: "/app/conversations" },
    ].find((item) => active(item.href) && item.href !== "/app")?.label ??
    "Overview";
  const close = () => dialog.current?.close();
  const navigation = (
    <>
      <Link
        className="sidebar-brand"
        href={screenHref("/app", preview)}
        onClick={close}
        aria-label="Avenlyo overview"
      >
        <Brand />
      </Link>
      <form
        className="workspace-picker"
        action={preview ? undefined : switchWorkspace}
      >
        <span className="workspace-monogram">{workspace.name[0]}</span>
        <div>
          <select
            aria-label="Workspace"
            name="workspaceId"
            defaultValue={workspace.id}
            disabled={preview || workspaces.length < 2}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <span className="workspace-caption">
            {role === "owner" ? "Your workspace" : "Team workspace"}
          </span>
        </div>
        <ChevronsUpDown aria-hidden="true" />
      </form>
      <nav aria-label="Main navigation">
        {groups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p className="nav-label">{group.label}</p>
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link
                className={`nav-link ${active(href) ? "is-active" : ""}`}
                href={screenHref(href, preview)}
                key={href}
                onClick={close}
                aria-current={active(href) ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                {label}
                {active(href) && <span className="nav-active-dot" />}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Link
          className={`nav-link ${active("/app/test-agent") ? "is-active" : ""}`}
          href={screenHref("/app/test-agent", preview)}
          onClick={close}
        >
          <FlaskConical aria-hidden="true" />
          Test agent
          <ArrowUpRight className="nav-end-icon" aria-hidden="true" />
        </Link>
        <Link
          className={`nav-link ${active("/app/settings") ? "is-active" : ""}`}
          href={screenHref("/app/settings", preview)}
          onClick={close}
        >
          <Settings2 aria-hidden="true" />
          Settings
        </Link>
        <div className="sidebar-tip">
          <span className="tip-icon">
            <Sparkles aria-hidden="true" />
          </span>
          <strong>A little setup. A lot less busywork.</strong>
          <p>Give your agent the knowledge to help your customers.</p>
          <Link href={screenHref("/app/agent", preview)} onClick={close}>
            Make it yours <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <div className="profile">
          <Avatar name={email.split("@")[0] || "Team"} small />
          <span>
            <strong>{email.split("@")[0] || "Your team"}</strong>
            <small>
              {role === "owner" ? "Workspace owner" : "Team member"}
            </small>
          </span>
          <form action={preview ? undefined : signOut}>
            <button
              type="submit"
              className="icon-button"
              aria-label="Sign out"
              disabled={preview}
            >
              <LogOut aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar desktop-sidebar">{navigation}</aside>
      <dialog
        ref={dialog}
        className="mobile-drawer"
        aria-label="Navigation"
        onClose={() => menu.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="sidebar">
          <button
            className="icon-button drawer-close"
            aria-label="Close navigation"
            onClick={close}
          >
            <X aria-hidden="true" />
          </button>
          {navigation}
        </div>
      </dialog>
      <div className="app-workspace">
        <header className="topbar">
          <button
            ref={menu}
            className="icon-button mobile-menu"
            onClick={() => dialog.current?.showModal()}
            aria-label="Open navigation"
          >
            <Menu aria-hidden="true" />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{label}</strong>
          </div>
          <div className="topbar-right">
            {preview ? (
              <Badge tone="accent">Design preview</Badge>
            ) : (
              <Link href="/workspaces" className="topbar-workspace">
                <span>{workspace.name}</span>
                <ChevronDown aria-hidden="true" />
              </Link>
            )}
            <span className="topbar-avatar">
              <Avatar name={email.split("@")[0] || "Team"} small />
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <span>Made for better conversations.</span>
          <span>
            <span className="footer-dot" />
            Avenlyo
          </span>
        </footer>
      </div>
    </div>
  );
}
