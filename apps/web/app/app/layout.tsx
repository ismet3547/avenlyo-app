import type { ReactNode } from "react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { Sidebar } from "@/components/sidebar";
import { signOut } from "../auth/actions";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { PendingButton } from "@/components/pending-button";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireWorkspace();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-white p-4 md:flex">
        <Sidebar />
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 sm:px-6 lg:px-9">
          <MobileNav />
          <div className="order-3 w-full sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">
            <WorkspaceSwitcher
              key={ctx.workspace.id}
              currentId={ctx.workspace.id}
              workspaces={ctx.workspaces}
            />
          </div>
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
              <PendingButton
                size="sm"
                variant="ghost"
                pendingText="Signing out…"
              >
                Sign out
              </PendingButton>
            </form>
          </div>
        </header>
        <main
          key={ctx.workspace.id}
          id="main-content"
          className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
