import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { productContext } from "@/lib/product-data";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await productContext();
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
