import { productContext } from "@/lib/product-data";
import { KnowledgeImport } from "@/components/knowledge-import";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const [ctx, params] = await Promise.all([productContext(), searchParams]);
  const source = params.source === "file" ? "file" : "webpage";
  return (
    <KnowledgeImport
      key={source}
      source={source}
      editable={ctx.role === "owner"}
    />
  );
}
