"use client";
import { Button } from "@/components/ui/button";
export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="max-w-lg rounded-xl border border-border bg-white p-8">
      <h1 className="text-xl font-semibold">
        We could not load this workspace
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Check that local Supabase is running and the foundation migration has
        been applied.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
