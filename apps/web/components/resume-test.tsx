"use client";
import { useActionState } from "react";
import { resumeTest } from "@/app/app/test-agent/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { FormFeedback } from "./form-feedback";

export function ResumeTest({ workspaceId, conversationId }: { workspaceId: string; conversationId: string }) {
  const [state, action, pending] = useActionState(resumeTest, { status: "idle", message: "" } as FormState);
  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <form action={action} className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-sm font-semibold text-amber-950">Test AI is paused</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">This test needs human assistance. Automated answers are paused.</p>
          <p className="mt-1 text-xs leading-5 text-amber-900">Resume when you are ready to test another automated answer. This only affects this test.</p>
        </div>
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="conversationId" value={conversationId} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Resuming…" : "Resume test AI"}</Button>
      </form>
      <FormFeedback state={state} className="mt-3" />
    </div>
  );
}
