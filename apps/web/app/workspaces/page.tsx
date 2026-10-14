import { requireUser } from "@/lib/workspace";
import { WorkspaceForm } from "@/components/workspace-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "../auth/actions";
import { switchWorkspace } from "./actions";
export default async function WorkspacesPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("workspaces")
    .select("id,name")
    .order("created_at");
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="flex items-center justify-between">
        <span className="text-xl font-semibold">Avenlyo</span>
        <form action={signOut}>
          <Button variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
      <h1 className="mt-12 text-3xl font-semibold tracking-tight">
        Your workspaces
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Each business has its own knowledge, conversations and leads.
      </p>
      {data?.length ? (
        <div className="mt-7 space-y-2">
          {data.map((w) => (
            <form action={switchWorkspace} key={w.id}>
              <input type="hidden" name="workspaceId" value={w.id} />
              <Button variant="outline" className="h-12 w-full justify-start">
                {w.name}
              </Button>
            </form>
          ))}
        </div>
      ) : null}
      <Card className="mt-8 p-6">
        <h2 className="font-semibold">Create a workspace</h2>
        <WorkspaceForm />
      </Card>
    </main>
  );
}
