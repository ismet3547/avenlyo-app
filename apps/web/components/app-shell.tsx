"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  FlaskConical,
  House,
  Inbox,
  LogOut,
  Menu,
  Network,
  PanelLeft,
  Settings2,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { switchWorkspace } from "@/app/workspaces/actions";
import { Brand, Avatar, Badge } from "./ui";
import { screenHref } from "@/lib/presentation";

const applications = [
  { label: "Home", href: "/app", icon: House },
  { label: "Inbox", href: "/app/inbox", icon: Inbox },
  { label: "Agent", href: "/app/agent", icon: Sparkles },
  { label: "Knowledge", href: "/app/knowledge", icon: BookOpen },
  { label: "Leads", href: "/app/leads", icon: UsersRound },
  { label: "Channels", href: "/app/channels", icon: Network },
];
const utilities = [
  { label: "Test agent", href: "/app/test-agent", icon: FlaskConical },
  { label: "Settings", href: "/app/settings", icon: Settings2 },
];
const history = {
  label: "Test history",
  href: "/app/conversations",
  icon: Inbox,
};
type Props = {
  children: ReactNode;
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string }[];
  email: string;
  role: string;
  preview?: boolean;
  activePath?: string;
  setup?: boolean;
};
export function AppShell({
  children,
  workspace,
  workspaces,
  email,
  role,
  preview = false,
  activePath,
  setup = false,
}: Props) {
  const pathname = usePathname();
  const current = activePath ?? pathname;
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const active = (href: string) =>
    href === "/app" ? current === href : current.startsWith(href);
  const selected =
    [...applications, ...utilities, history].find(
      (item) => item.href !== "/app" && active(item.href),
    ) ?? applications[0];
  const isInbox = current.startsWith("/app/inbox");
  const isAI = [
    "/app/agent",
    "/app/knowledge",
    "/app/channels",
    "/app/test-agent",
    "/app/conversations",
  ].some((path) => current.startsWith(path));
  const contextItems =
    isInbox || current.startsWith("/app/leads")
      ? applications.filter((item) => ["Inbox", "Leads"].includes(item.label))
      : isAI
        ? [
            ...applications.filter((item) =>
              ["Agent", "Knowledge", "Channels"].includes(item.label),
            ),
            utilities[0],
            history,
          ]
        : [applications[0], utilities[1]];
  const close = () => dialog.current?.close();
  const navLinks = (items: typeof applications) =>
    items.map(({ href, label, icon: Icon }) => (
      <Link
        className={`nav-link ${active(href) ? "is-active" : ""}`}
        href={screenHref(href, preview)}
        key={href}
        onClick={close}
        aria-current={active(href) ? "page" : undefined}
      >
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </Link>
    ));
  const workspacePicker = (
    <form
      className="workspace-picker"
      action={preview ? undefined : switchWorkspace}
    >
      <span className="workspace-monogram">{workspace.name[0]}</span>
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
      <ChevronDown aria-hidden="true" />
    </form>
  );
  const secondary = (mobile = false) => (
    <>
      <div className="sidebar-heading">
        {mobile ? <Brand /> : <p className="sidebar-title">{selected.label}</p>}
      </div>
      <nav aria-label="Main navigation">
        <div className="nav-group">
          {navLinks(mobile ? applications : contextItems)}
        </div>
        {mobile && (
          <div className="nav-group">
            <p className="nav-label">Manage</p>
            {navLinks([...utilities, history])}
          </div>
        )}
      </nav>
      <div className="sidebar-resources">
        <p className="nav-label">Workspace</p>
        <Link
          href={screenHref("/app", preview)}
          className="nav-link"
          onClick={close}
        >
          <House aria-hidden="true" />
          Home
          <ArrowUpRight className="nav-end-icon" aria-hidden="true" />
        </Link>
        <Link
          href={screenHref("/app/test-agent", preview)}
          className="nav-link"
          onClick={close}
        >
          <FlaskConical aria-hidden="true" />
          Agent playground
        </Link>
      </div>
      <div className="sidebar-bottom">
        {workspacePicker}
        <div className="profile">
          <Avatar name={email.split("@")[0] || "Team"} small />
          <span>
            <strong>{email.split("@")[0] || "Your team"}</strong>
            <small>
              {role === "owner" ? "Workspace owner" : "Team member"}
            </small>
          </span>
        </div>
        {mobile && (
          <form action={preview ? undefined : signOut}>
            <button className="nav-link" disabled={preview}>
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </form>
        )}
      </div>
    </>
  );
  return (
    <div
      className={`app-shell ${isInbox ? "is-inbox" : ""} ${setup ? "setup-shell focused-type" : ""}`}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {!setup && (
        <aside className="application-rail" aria-label="Applications">
          <Link
            className="rail-brand"
            href={screenHref("/app", preview)}
            aria-label="Avenlyo Home"
          >
            <Brand compact />
          </Link>
          <nav aria-label="Application switcher">
            {applications.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={screenHref(href, preview)}
                className={`rail-link ${active(href) ? "is-active" : ""}`}
                aria-label={`Open ${label}`}
                aria-current={active(href) ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                <span className="rail-tooltip">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="rail-bottom">
            {utilities.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={screenHref(href, preview)}
                className={`rail-link ${active(href) ? "is-active" : ""}`}
                aria-label={`Open ${label}`}
              >
                <Icon aria-hidden="true" />
                <span className="rail-tooltip">{label}</span>
              </Link>
            ))}
            <form action={preview ? undefined : signOut}>
              <button
                className="rail-link"
                aria-label="Sign out"
                disabled={preview}
              >
                <LogOut aria-hidden="true" />
                <span className="rail-tooltip">Sign out</span>
              </button>
            </form>
            <Link
              href="/workspaces"
              className="rail-profile"
              aria-label="Choose workspace"
            >
              <Avatar name={email.split("@")[0] || "Team"} small />
            </Link>
          </div>
        </aside>
      )}
      {!setup && (
        <aside className="sidebar desktop-sidebar">{secondary()}</aside>
      )}
      {!setup && (
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
            {secondary(true)}
          </div>
        </dialog>
      )}
      <div className="app-workspace">
        {setup ? (
          <header className="setup-topbar">
            <Link href="/onboarding" aria-label="Avenlyo setup">
              <Brand />
            </Link>
            <div className="setup-account">
              <Link href="/workspaces">{workspace.name}</Link>
              <form action={signOut}>
                <button className="button button-ghost">Sign out</button>
              </form>
            </div>
          </header>
        ) : (
          <header className="mobile-topbar">
            <button
              ref={menu}
              className="icon-button"
              onClick={() => dialog.current?.showModal()}
              aria-label="Open navigation"
            >
              <Menu aria-hidden="true" />
            </button>
            <Brand compact />
            <span>{workspace.name}</span>
            {preview && <Badge>Preview</Badge>}
          </header>
        )}
        {preview && (
          <div className="preview-mode">
            <PanelLeft aria-hidden="true" />
            Design preview<span>Fictional data · read only</span>
          </div>
        )}
        {/* Keep this main subtree mounted when activation reveals navigation so
            existing forms retain their real success/error feedback. */}
        <main
          key="workspace-content"
          id="main-content"
          className={setup ? "setup-main" : "main-content"}
          tabIndex={-1}
        >
          {setup && (
            <Link
              key="setup-return"
              className="text-link setup-back"
              href="/onboarding"
            >
              ← Back to setup
            </Link>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
