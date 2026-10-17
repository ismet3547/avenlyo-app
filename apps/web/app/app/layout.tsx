import type { ReactNode } from "react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { Sidebar } from "@/components/sidebar";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Building2, LogOut } from "lucide-react";
import { signOut } from "../auth/actions";
import { switchWorkspace } from "../workspaces/actions";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireWorkspace();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#workspace-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col bg-sidebar px-3 py-5 lg:flex">
        <Sidebar workspaceName={ctx.workspace.name} />
      </aside>
      <div className="min-w-0">
        <header className="workspace-topbar flex h-14 items-center justify-between gap-2 border-b border-border bg-background px-4 sm:px-7">
          <MobileNavigation workspaceName={ctx.workspace.name} />
          <form
            action={switchWorkspace}
            className="mr-auto flex min-w-0 items-center gap-2.5"
          >
            <label htmlFor="workspace-select" className="sr-only">
              Current workspace
            </label>
            <Building2
              aria-hidden
              className="hidden size-4 text-muted-foreground sm:block"
            />
            <select
              id="workspace-select"
              name="workspaceId"
              defaultValue={ctx.workspace.id}
              className="max-w-40 rounded-md bg-transparent py-2 text-[13px] font-medium focus-visible:outline-primary sm:max-w-56"
            >
              {ctx.workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {ctx.workspaces.length > 1 && (
              <Button size="sm" variant="ghost">
                Switch
              </Button>
            )}
          </form>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/workspaces"
              className="hidden text-xs text-muted-foreground hover:text-primary sm:inline"
            >
              Manage workspaces
            </Link>
            <span className="hidden border-l border-border pl-3 text-xs capitalize text-muted-foreground xl:inline">
              {ctx.role}
            </span>
            <form action={signOut}>
              <Button size="sm" variant="ghost">
                <LogOut aria-hidden className="hidden sm:block" />
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main
          id="workspace-content"
          tabIndex={-1}
          className="workspace-main mx-auto max-w-[1680px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
