import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { productContext } from "@/lib/product-data";
import { onboardingState } from "@/lib/onboarding";
import { SetupShell } from "@/components/setup-shell";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await productContext();
  const state = await onboardingState();
  if (!state.completedAt)
    return (
      <SetupShell workspace={ctx.workspace} returnLink>
        {children}
      </SetupShell>
    );
  return (
    <AppShell
      workspace={ctx.workspace}
      workspaces={ctx.workspaces}
      email={ctx.user.email ?? "Your team"}
      role={ctx.role}
    >
      {children}
    </AppShell>
  );
}
