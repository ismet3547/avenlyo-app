import { knowledgeData } from "@/lib/knowledge-data";
import { KnowledgeLibrary } from "@/components/knowledge-library";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const [data, params] = await Promise.all([knowledgeData(), searchParams]);
  return (
    <KnowledgeLibrary
      {...data}
      initialCollection={params.collection}
      now={Date.now()}
    />
  );
}
