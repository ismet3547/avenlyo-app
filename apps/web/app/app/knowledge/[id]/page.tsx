import { notFound } from "next/navigation";
import { z } from "zod";
import { productContext } from "@/lib/product-data";
import { KnowledgeEditor } from "@/components/knowledge-editor";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; source?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
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
    <KnowledgeEditor
      key={`${id}:${item.data.revision}`}
      item={item.data}
      collections={collections.data}
      editable={ctx.role === "owner"}
      notice={query.notice}
      source={query.source?.slice(0, 253)}
    />
  );
}
