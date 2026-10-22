import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/workspace";
import { switchWorkspace } from "./actions";
import { Brand, Panel, PageHeader, Avatar } from "@/components/ui";
import { WorkspaceForm } from "@/components/product-forms";
export default async function Page() {
  const ctx = await requireUser();
  const spaces = await ctx.supabase
    .from("workspaces")
    .select("id,name")
    .order("created_at");
  if (spaces.error) throw new Error("Your workspaces could not be loaded.");
  return (
    <main className="workspace-page">
      <Brand />
      <PageHeader
        title="A place for your business."
        description="Choose a workspace, or create a fresh one for your team."
      />
      {spaces.data.length > 0 && (
        <div className="workspace-choices">
          {spaces.data.map((w) => (
            <form action={switchWorkspace} key={w.id}>
              <input type="hidden" name="workspaceId" value={w.id} />
              <button className="workspace-choice">
                <Avatar name={w.name} />
                <span>
                  <strong>{w.name}</strong>
                  <p>Open workspace</p>
                </span>
                <ArrowRight aria-hidden="true" />
              </button>
            </form>
          ))}
        </div>
      )}
      <Panel
        title="Create a workspace"
        description="A little setup. A lot more clarity."
      >
        <WorkspaceForm />
      </Panel>
    </main>
  );
}
