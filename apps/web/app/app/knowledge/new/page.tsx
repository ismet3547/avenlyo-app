import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { KnowledgeForm } from "@/components/knowledge-form";
export default async function NewKnowledge() {
  if ((await requireWorkspace()).role !== "owner") redirect("/app/knowledge");
  return (
    <>
      <PageHeader
        title="Add knowledge"
        description="Create a text source or FAQ. Save as a draft before publishing."
      />
      <KnowledgeForm />
    </>
  );
}
