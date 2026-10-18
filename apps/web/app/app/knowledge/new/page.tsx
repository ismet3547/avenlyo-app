import { redirect } from "next/navigation";
import { knowledgeTypes, type KnowledgeType } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { KnowledgeForm } from "@/components/knowledge-form";
export default async function NewKnowledge({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; collection?: string }>;
}) {
  const ctx = await requireWorkspace();
  if (ctx.role !== "owner") redirect("/app/knowledge");
  const params = await searchParams;
  const collections = await ctx.supabase
    .from("knowledge_collections")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("name");
  return (
    <div className="knowledge-screen knowledge-editor-screen">
      <PageHeader
        title="Add knowledge"
        description="Give customers accurate information about your business."
      />
      {collections.error ? (
        <p role="alert">Collections could not be loaded. Reload to continue.</p>
      ) : (
        <KnowledgeForm
          collections={collections.data}
          initialType={
            knowledgeTypes.includes(params.type as KnowledgeType)
              ? (params.type as KnowledgeType)
              : undefined
          }
          initialCollection={
            collections.data.some((c) => c.id === params.collection)
              ? params.collection
              : undefined
          }
        />
      )}
    </div>
  );
}
