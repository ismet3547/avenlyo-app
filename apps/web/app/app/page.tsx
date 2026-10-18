import { Overview } from "@/components/overview";
import { overviewData, productContext } from "@/lib/product-data";
export default async function Page() {
  const [ctx, data] = await Promise.all([productContext(), overviewData()]);
  return <Overview name={ctx.workspace.name} data={data} />;
}
