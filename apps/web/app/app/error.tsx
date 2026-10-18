"use client";
import { RotateCcw } from "lucide-react";
import { Button, Panel } from "@/components/ui";
export default function ErrorState({ reset }: { reset: () => void }) {
  return (
    <Panel>
      <div className="standalone-state">
        <h1>A moment to reconnect.</h1>
        <p>We couldn’t load this part of your workspace. Please try again.</p>
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </div>
    </Panel>
  );
}
