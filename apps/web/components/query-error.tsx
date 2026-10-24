"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
export function QueryError({ message }: { message: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="rounded-xl border border-red-200 bg-white p-5">
      <p role="alert" className="text-sm leading-6 text-red-800">
        {message}
      </p>
      <Button
        variant="outline"
        className="mt-4"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
