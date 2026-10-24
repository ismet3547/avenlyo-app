"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWorkspace } from "@/lib/workspace";
import { workspaceFormError } from "@/lib/workspace-form";
import type { FormState } from "@/app/auth/actions";
export async function resumeTest(_state: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireWorkspace();
  const workspaceError = workspaceFormError(form, ctx.workspace.id);
  if (workspaceError) return workspaceError;
  const id = z.uuid().safeParse(form.get("conversationId"));
  if (!id.success) return { status: "error", message: "This test is unavailable. Open a saved conversation or start a new test." };
  const result = await ctx.supabase.rpc("resume_test_conversation", {
    target_workspace_id: ctx.workspace.id,
    target_conversation_id: id.data,
  });
  if (result.error) return { status: "error", message: "The test could not be resumed. Refresh the page to check your access, then try again." };
  revalidatePath("/app/test-agent");
  revalidatePath("/app/conversations");
  return { status: "success", message: "Test AI resumed. Send a customer message to continue." };
}
