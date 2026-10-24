import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { KnowledgeForm } from "@/components/knowledge-form";
export default async function NewKnowledge() {
  const ctx = await requireWorkspace();
  if (ctx.role !== "owner") redirect("/app/knowledge");
  return (
    <>
      <PageHeader
        title="Add knowledge"
        description="Write something useful about your business. A service description or a clear FAQ is a great start."
      />
      <KnowledgeForm workspaceId={ctx.workspace.id} />
    </>
  );
}
