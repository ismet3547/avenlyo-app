import { knowledgeData } from "@/lib/knowledge-data";
import { KnowledgeCollections } from "@/components/knowledge-collections";
export default async function Page() {
  return <KnowledgeCollections {...await knowledgeData()} />;
}
