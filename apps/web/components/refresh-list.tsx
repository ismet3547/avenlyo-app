"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
export function RefreshList() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine)
        startTransition(() => router.refresh());
    }, 15000);
    return () => clearInterval(timer);
  }, [router]);
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Customer channels only · refreshes every 15 seconds
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        <RefreshCw aria-hidden />
        {pending ? "Refreshing…" : "Refresh Inbox"}
      </Button>
    </div>
  );
}
