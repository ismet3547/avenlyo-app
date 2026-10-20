import "server-only";
import { cache } from "react";
import { productContext } from "./product-data";
import { onboardingSchema } from "./onboarding-model";

export const onboardingState = cache(async () => {
  const ctx = await productContext();
  const result = await ctx.supabase.rpc("sync_onboarding", {
    target_workspace_id: ctx.workspace.id,
  });
  if (result.error)
    throw new Error("Setup progress could not be loaded. Please try again.");
  return onboardingSchema.parse(result.data);
});
