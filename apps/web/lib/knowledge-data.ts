import "server-only";
import { cache } from "react";
import { productContext } from "./product-data";
export const knowledgeData = cache(async () => {
  const ctx = await productContext();
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
  return {
    items: items.data,
    collections: collections.data,
    editable: ctx.role === "owner",
  };
});
