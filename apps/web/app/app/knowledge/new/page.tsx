import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { productContext } from "@/lib/product-data";
import { KnowledgeForm } from "@/components/product-forms";
import { PageHeader, Panel } from "@/components/ui";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [ctx, params] = await Promise.all([productContext(), searchParams]);
  const collections = await ctx.supabase
    .from("knowledge_collections")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("name");
  if (collections.error) throw new Error("Collections could not be loaded.");
  return (
    <>
      <Link
        className="text-link"
        href="/app/knowledge"
        style={{ marginBottom: 22 }}
      >
        <ArrowLeft aria-hidden="true" />
        Back to knowledge
      </Link>
      <PageHeader
        title="Share a little knowledge."
        description="One clear piece of information. Better answers for your customers."
      />
      <div className="form-layout">
        <Panel>
          <KnowledgeForm
            collections={collections.data}
            editable={ctx.role === "owner"}
            initialType={params.type}
          />
        </Panel>
        <Panel className="help-copy">
          <BookOpen aria-hidden="true" />
          <h3>Clear. Specific. Useful.</h3>
          <p>
            Keep each item focused on one subject. Use the words your customers
            use, and include details they need to make a decision.
          </p>
          <p>Drafts stay private until you publish them.</p>
        </Panel>
      </div>
    </>
  );
}
