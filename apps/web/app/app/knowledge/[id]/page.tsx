import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { KnowledgeForm } from "@/components/knowledge-form";
export default async function EditKnowledge({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireWorkspace();
  const { id } = await params;
  const item = await ctx.supabase
    .from("knowledge_items")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .single();
  if (item.error || ctx.role !== "owner") notFound();
  const collections = await ctx.supabase
    .from("knowledge_collections")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("name");
  return (
    <div className="knowledge-screen knowledge-editor-screen">
      <PageHeader
        title="Edit knowledge"
        description="Changes are saved as a draft. Publish again after reviewing the updated information."
      />
      {collections.error ? (
        <p role="alert">Collections could not be loaded. Reload to continue.</p>
      ) : (
        <KnowledgeForm item={item.data} collections={collections.data} />
      )}
    </div>
  );
}
