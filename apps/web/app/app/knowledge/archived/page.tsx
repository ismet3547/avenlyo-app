import { knowledgeData } from "@/lib/knowledge-data";
import { KnowledgeLibrary } from "@/components/knowledge-library";
export default async function Page() {
  return (
    <KnowledgeLibrary {...await knowledgeData()} archived now={Date.now()} />
  );
}
