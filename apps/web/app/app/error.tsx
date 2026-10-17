"use client";
import { Button } from "@/components/ui/button";
export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="max-w-lg rounded-xl border border-border bg-card p-8">
      <h1 className="text-xl font-semibold">
        We could not load this workspace
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Your connection or workspace access may have changed. Try again to
        reload the page.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
