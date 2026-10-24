"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function PageError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">This page could not be loaded</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        The service may be temporarily unavailable. Try again or return to your
        workspaces to check your access.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/workspaces">Your workspaces</Link>
        </Button>
      </div>
    </main>
  );
}
