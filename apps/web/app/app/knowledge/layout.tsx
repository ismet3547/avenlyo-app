import type { ReactNode } from "react";
import "./knowledge.css";
export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return <div className="knowledge-workspace">{children}</div>;
}
