import type { ReactNode } from "react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { Sidebar } from "@/components/sidebar";
import { signOut } from "../auth/actions";
import { switchWorkspace } from "../workspaces/actions";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireWorkspace();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-white p-4 md:flex">
        <Sidebar />
      </aside>
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-white/90 px-5 lg:px-9">
          <details className="relative md:hidden">
            <summary className="cursor-pointer text-sm font-semibold">
              Avenlyo · Menu
            </summary>
            <div className="absolute left-0 top-9 z-30 w-60 rounded-xl border border-border bg-white p-4 shadow-lg">
              <Sidebar />
            </div>
          </details>
          <form
            action={switchWorkspace}
            className="flex min-w-0 items-center gap-2"
          >
            <label htmlFor="workspace-select" className="sr-only">
              Current workspace
            </label>
            <select
              id="workspace-select"
              name="workspaceId"
              defaultValue={ctx.workspace.id}
              className="max-w-44 rounded-md bg-transparent py-1 text-sm font-medium focus-visible:outline-primary"
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
          <div className="flex items-center gap-3">
            <Link
              href="/workspaces"
              className="hidden text-xs text-muted-foreground hover:text-primary sm:inline"
            >
              Manage workspaces
            </Link>
            <span className="hidden text-xs capitalize text-muted-foreground lg:inline">
              {ctx.role}
            </span>
            <form action={signOut}>
              <Button size="sm" variant="ghost">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main key={ctx.workspace.id} id="main-content" className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
