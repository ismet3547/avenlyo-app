import type { ReactNode } from "react";
import { SetupShell } from "@/components/setup-shell";
import { productContext } from "@/lib/product-data";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: ReactNode }) {
  const ctx = await productContext();
  return <SetupShell workspace={ctx.workspace}>{children}</SetupShell>;
}
