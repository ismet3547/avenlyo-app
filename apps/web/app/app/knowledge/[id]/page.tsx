import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { productContext } from "@/lib/product-data";
import { KnowledgeActions, KnowledgeForm } from "@/components/product-forms";
import { PageHeader, Panel } from "@/components/ui";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const ctx = await productContext();
  const [item, collections] = await Promise.all([
    ctx.supabase
      .from("knowledge_items")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("id", id)
      .maybeSingle(),
    ctx.supabase
      .from("knowledge_collections")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .order("name"),
  ]);
  if (item.error || collections.error)
    throw new Error("Knowledge could not be loaded.");
  if (!item.data) notFound();
  return (
    <>
      <Link
        href="/app/knowledge"
        className="text-link"
        style={{ marginBottom: 22 }}
      >
        <ArrowLeft aria-hidden="true" />
        Back to knowledge
      </Link>
      <PageHeader
        title="A little more detail."
        description="Keep your knowledge accurate, useful and up to date."
        action={
          <KnowledgeActions item={item.data} editable={ctx.role === "owner"} />
        }
      />
      <Panel>
        <KnowledgeForm
          item={item.data}
          collections={collections.data}
          editable={ctx.role === "owner"}
        />
      </Panel>
    </>
  );
}
