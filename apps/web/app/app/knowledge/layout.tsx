import type { ReactNode } from "react";
export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="knowledge-workspace workspace-page-spacing">{children}</div>
  );
}
