import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { knowledgeLabels, knowledgeTypes } from "@avenlyo-app/shared";
import { productContext } from "@/lib/product-data";
import { KnowledgeEditor } from "@/components/knowledge-editor";
import { KnowledgeBack } from "@/components/knowledge-primitives";
const descriptions = [
  "Describe what you offer.",
  "Prices and how they’re calculated.",
  "One question and a clear answer.",
  "Rules customers should know.",
  "Hours, location or other business facts.",
  "Other useful information.",
];
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [ctx, params] = await Promise.all([productContext(), searchParams]);
  const type = knowledgeTypes.find(
    (type) =>
      type === params.type ||
      (type === "custom_note" && params.type === "text"),
  );
  if (!type)
    return (
      <>
        <KnowledgeBack />
        <header className="knowledge-heading">
          <div>
            <h1>What kind of information are you adding?</h1>
            <p>Choose the type that best fits this knowledge.</p>
          </div>
        </header>
        <div className="knowledge-type-choices">
          {knowledgeTypes.map((type, index) => (
            <Link href={`/app/knowledge/new?type=${type}`} key={type}>
              <div>
                <strong>{knowledgeLabels[type]}</strong>
                <span>{descriptions[index]}</span>
              </div>
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </>
    );
  const collections = await ctx.supabase
    .from("knowledge_collections")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("name");
  if (collections.error) throw new Error("Knowledge could not be loaded.");
  return (
    <KnowledgeEditor
      initialType={type}
      collections={collections.data}
      editable={ctx.role === "owner"}
    />
  );
}
