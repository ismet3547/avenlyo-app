import type { ReactNode } from "react";
import "./agent.css";
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="agent-workspace workspace-page-spacing">{children}</div>
  );
}
