import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Building2, LogOut, ArrowUpRight } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb, MobileNavigation } from "@/components/shell-navigation";
import { signOut } from "../auth/actions";
import { switchWorkspace } from "../workspaces/actions";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireWorkspace();
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="desktop-sidebar">
        <Sidebar />
      </aside>
      <div className="min-w-0">
        <header className="workspace-header">
          <div className="flex min-w-0 items-center gap-2">
            <MobileNavigation />
            <Breadcrumb />
          </div>
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <form
              action={switchWorkspace}
              className="flex min-w-0 items-center gap-2"
            >
              <Building2
                className="hidden size-4 text-muted-foreground sm:block"
                aria-hidden="true"
              />
              <label htmlFor="workspace-select" className="sr-only">
                Current workspace
              </label>
              <select
                id="workspace-select"
                name="workspaceId"
                defaultValue={ctx.workspace.id}
                className="workspace-select"
              >
                {ctx.workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {ctx.workspaces.length > 1 && (
                <Button size="sm" variant="outline">
                  Switch
                </Button>
              )}
            </form>
            <details className="account-menu">
              <summary aria-label="Account options">
                <span className="account-avatar">
                  {ctx.workspace.name.charAt(0).toUpperCase()}
                </span>
                <ChevronDown
                  className="size-3 text-muted-foreground"
                  aria-hidden="true"
                />
              </summary>
              <div className="account-popover">
                <p className="truncate text-sm font-semibold">
                  {ctx.workspace.name}
                </p>
                <p className="mb-4 mt-1 text-xs capitalize text-muted-foreground">
                  Workspace {ctx.role}
                </p>
                <Link
                  href="/workspaces"
                  className="flex items-center justify-between rounded-lg p-2 text-xs hover:bg-muted"
                >
                  Manage workspaces
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
                <form action={signOut}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1 w-full justify-start"
                  >
                    <LogOut aria-hidden="true" />
                    Sign out
                  </Button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" className="workspace-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
