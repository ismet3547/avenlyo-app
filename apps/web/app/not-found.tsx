import { ArrowLeft } from "lucide-react";
import { ActionLink, Brand } from "@/components/ui";
export default function NotFound() {
  return (
    <main className="standalone-state">
      <Brand />
      <h1>This page has wandered off.</h1>
      <p>
        The page may have moved, or you may need to switch workspaces to see it.
      </p>
      <ActionLink href="/app">
        <ArrowLeft aria-hidden="true" />
        Back to your workspace
      </ActionLink>
    </main>
  );
}
