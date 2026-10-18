"use client";
import Link from "next/link";
import { RotateCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-border bg-white p-8 text-center">
      <WifiOff className="mx-auto size-7 text-muted-foreground" aria-hidden />
      <h1 className="mt-5 text-xl font-medium tracking-tight">
        We could not load this workspace
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        The connection may have been interrupted. Try again to get the latest
        information.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/workspaces">Choose a workspace</Link>
        </Button>
      </div>
    </div>
  );
}
