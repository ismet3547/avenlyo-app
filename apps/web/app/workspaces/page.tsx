import { ArrowRight, Building2, Plus } from "lucide-react";
import { requireUser } from "@/lib/workspace";
import { Brand } from "@/components/brand";
import { WorkspaceForm } from "@/components/workspace-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "../auth/actions";
import { switchWorkspace } from "./actions";
export default async function WorkspacesPage() {
  const { supabase } = await requireUser();
  const result = await supabase
    .from("workspaces")
    .select("id,name")
    .order("created_at");
  return (
    <main className="mx-auto max-w-5xl px-6 py-9 sm:py-12">
      <header className="flex items-center justify-between">
        <Brand />
        <form action={signOut}>
          <Button variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </header>
      <div className="mx-auto max-w-lg pb-12 pt-16 sm:pt-24">
        <p className="eyebrow">Your space to work</p>
        <h1 className="page-title">
          {result.data?.length
            ? "Welcome to your workspaces"
            : "Let’s start with your business"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Each workspace keeps its own agent, knowledge and customer
          conversations. Choose a business or create a new one.
        </p>
        {result.error && (
          <p role="alert" className="form-message mt-6 bg-red-50 text-red-700">
            Your workspaces could not be loaded. Refresh to try again.
          </p>
        )}
        {result.data?.length ? (
          <div className="mt-8 space-y-3">
            {result.data.map((w) => (
              <form action={switchWorkspace} key={w.id}>
                <input type="hidden" name="workspaceId" value={w.id} />
                <button
                  type="submit"
                  className="surface-link flex w-full items-center gap-4 rounded-xl border border-border bg-white p-5 text-left"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-sm font-medium text-primary">
                    {w.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {w.name}
                  </span>
                  <ArrowRight
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                </button>
              </form>
            ))}
          </div>
        ) : null}
        <Card className="mt-8 p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-muted">
              {result.data?.length ? (
                <Plus className="size-4 text-primary" aria-hidden />
              ) : (
                <Building2 className="size-4 text-primary" aria-hidden />
              )}
            </span>
            <h2 className="text-sm font-semibold">Create a workspace</h2>
          </div>
          <WorkspaceForm />
        </Card>
      </div>
    </main>
  );
}
