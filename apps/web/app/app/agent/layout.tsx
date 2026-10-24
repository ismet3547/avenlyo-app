import type { ReactNode } from "react";
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="agent-workspace workspace-page-spacing">{children}</div>
  );
}
