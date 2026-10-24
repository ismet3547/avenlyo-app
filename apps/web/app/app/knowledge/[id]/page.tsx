import Link from "next/link";
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
  return (
    <>
      <Link
        href="/app/knowledge"
        className="mb-5 inline-block py-2 text-sm text-muted-foreground hover:text-primary"
      >
        ← All knowledge
      </Link>
      <PageHeader
        title="Edit knowledge"
        description="Changes are saved as a draft. Publish again after reviewing the updated information."
      />
      <KnowledgeForm workspaceId={ctx.workspace.id} item={item.data} />
    </>
  );
}
