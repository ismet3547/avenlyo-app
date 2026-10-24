"use client";
import { Button } from "@/components/ui/button";
export default function WorkspacesError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">
        Workspaces are temporarily unavailable
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Your workspaces could not be loaded. Try again to check your current
        access.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
