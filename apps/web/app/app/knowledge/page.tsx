import { Plus, ChevronDown, FolderPlus } from "lucide-react";
import { productContext } from "@/lib/product-data";
import { ActionLink, PageHeader, Panel, Notice } from "@/components/ui";
import { KnowledgeLibrary } from "@/components/knowledge-library";
import { CollectionForm, ImportForms } from "@/components/product-forms";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; collection?: string }>;
}) {
  const [ctx, params] = await Promise.all([productContext(), searchParams]);
  const [items, collections] = await Promise.all([
    ctx.supabase
      .from("knowledge_items")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .order("updated_at", { ascending: false }),
    ctx.supabase
      .from("knowledge_collections")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .order("name"),
  ]);
  if (items.error || collections.error)
    throw new Error("Knowledge could not be loaded.");
  const editable = ctx.role === "owner";
  return (
    <>
      <PageHeader
        eyebrow="GOOD ANSWERS START HERE"
        title="What your business knows."
        description="The services, details and answers that make your agent helpful."
        action={
          editable && (
            <ActionLink href="/app/knowledge/new">
              <Plus aria-hidden="true" />
              Add knowledge
            </ActionLink>
          )
        }
      />
      <div className="stack">
        {params.notice &&
          items.data.some((item) => item.status === "draft") && (
            <Notice>
              {params.notice === "imported"
                ? "Imported as a draft. Review the content, then publish when you’re ready."
                : "Draft saved. Publish it when you’re ready for your agent to use it."}
            </Notice>
          )}
        <KnowledgeLibrary
          items={items.data}
          collections={collections.data}
          editable={editable}
          initialCollection={params.collection}
        />
        {editable && (
          <>
            <Panel>
              <details className="disclosure">
                <summary>
                  <span className="row">
                    <Plus aria-hidden="true" />
                    More ways to add knowledge
                  </span>
                  <ChevronDown aria-hidden="true" />
                </summary>
                <div className="panel-body">
                  <ImportForms editable />
                </div>
              </details>
            </Panel>
            <Panel>
              <details className="disclosure">
                <summary>
                  <span className="row">
                    <FolderPlus aria-hidden="true" />
                    Organize with collections
                  </span>
                  <ChevronDown aria-hidden="true" />
                </summary>
                <div className="panel-body">
                  <CollectionForm />
                  {collections.data.map((collection) => (
                    <details className="disclosure" key={collection.id}>
                      <summary>
                        Rename {collection.name}
                        <ChevronDown aria-hidden="true" />
                      </summary>
                      <div className="panel-body">
                        <CollectionForm collection={collection} />
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
