"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { signOut } from "@/app/auth/actions";
import { switchWorkspace } from "@/app/workspaces/actions";
import { Brand } from "./ui";
const destinations = [
  ["Home", "/app"],
  ["Inbox", "/app/inbox"],
  ["Leads", "/app/leads"],
  ["Agent", "/app/agent"],
  ["Knowledge", "/app/knowledge"],
  ["Channels", "/app/channels"],
  ["Test agent", "/app/test-agent"],
  ["Test history", "/app/conversations"],
  ["Settings", "/app/settings"],
] as const;
type Props = {
  children: ReactNode;
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string }[];
  email: string;
  role: string;
  setup?: boolean;
};
export function AppShell({
  children,
  workspace,
  workspaces,
  email,
  role,
  setup = false,
}: Props) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const close = () => dialog.current?.close();
  const navigation = (
    <>
      <Link href="/app">
        <Brand />
      </Link>
      <nav aria-label="Main navigation">
        {destinations.map(([label, href]) => (
          <Link
            key={href}
            className="nav-link"
            href={href}
            onClick={close}
            aria-current={
              (href === "/app" ? pathname === href : pathname.startsWith(href))
                ? "page"
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-account">
        <form className="workspace-picker" action={switchWorkspace}>
          <label>
            Workspace
            <select
              aria-label="Workspace"
              name="workspaceId"
              defaultValue={workspace.id}
              disabled={workspaces.length < 2}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        </form>
        <Link href="/workspaces">Choose or create workspace</Link>
        <p>
          {email}
          <br />
          {role === "owner" ? "Workspace owner" : "Team member"}
        </p>
        <form action={signOut}>
          <button>Sign out</button>
        </form>
      </div>
    </>
  );
  return (
    <div className={"app-shell" + (setup ? " setup-shell" : "")}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {!setup && <aside className="desktop-sidebar">{navigation}</aside>}
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
          <button aria-label="Close navigation" onClick={close}>
            Close navigation
          </button>
          {navigation}
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
                <button>Sign out</button>
              </form>
            </div>
          </header>
        ) : (
          <header className="mobile-topbar">
            <button
              ref={menu}
              onClick={() => dialog.current?.showModal()}
              aria-label="Open navigation"
            >
              Menu
            </button>
            <span>{workspace.name}</span>
          </header>
        )}
        {/* Preserve the mounted form subtree when setup completion reveals navigation. */}
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
