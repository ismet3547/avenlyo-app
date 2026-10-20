import { Overview } from "@/components/overview";
import { redirect } from "next/navigation";
import { overviewData } from "@/lib/product-data";
import { onboardingState } from "@/lib/onboarding";
export default async function Page() {
  const state = await onboardingState();
  if (!state.completedAt) redirect("/onboarding");
  return <Overview data={await overviewData()} />;
}
