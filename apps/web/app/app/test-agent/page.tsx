import { History } from "lucide-react";
import { ActionLink, PageHeader } from "@/components/ui";
import { TestAgent } from "@/components/conversations";
import { productContext } from "@/lib/product-data";
export default async function Page() {
  const ctx = await productContext();
  const knowledge = await ctx.supabase
    .from("knowledge_items")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id)
    .eq("status", "published");
  return (
    <>
      <PageHeader
        title="Test agent"
        description="Test answers using your published knowledge."
        action={
          <ActionLink href="/app/conversations" secondary>
            <History aria-hidden="true" />
            Test history
          </ActionLink>
        }
      />
      <TestAgent
        key="new-test"
        workspaceId={ctx.workspace.id}
        published={knowledge.error ? null : (knowledge.count ?? 0)}
      />
    </>
  );
}
