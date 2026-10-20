import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "./ui";
import { signOut } from "@/app/auth/actions";
import type { Workspace } from "@avenlyo-app/shared";
export function SetupShell({
  workspace,
  children,
  returnLink = false,
}: {
  workspace: Pick<Workspace, "name">;
  children: ReactNode;
  returnLink?: boolean;
}) {
  return (
    <div className="setup-shell focused-type">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
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
      <main id="main-content" className="setup-main" tabIndex={-1}>
        {returnLink && (
          <Link className="text-link setup-back" href="/onboarding">
            ← Back to setup
          </Link>
        )}
        {children}
      </main>
    </div>
  );
}
