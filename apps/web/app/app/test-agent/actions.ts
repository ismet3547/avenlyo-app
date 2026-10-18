"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWorkspace } from "@/lib/workspace";
import type { FormState } from "@/app/auth/actions";
export async function resumeTest(form: FormData): Promise<FormState> {
  const ctx = await requireWorkspace();
  const id = z.uuid().safeParse(form.get("conversationId"));
  if (!id.success)
    return {
      status: "error",
      message: "This test could not be resumed. Reload and try again.",
    };
  const result = await ctx.supabase.rpc("resume_test_conversation", {
    target_workspace_id: ctx.workspace.id,
    target_conversation_id: id.data,
  });
  if (result.error)
    return {
      status: "error",
      message: "This test could not be resumed. Please try again.",
    };
  revalidatePath("/app/test-agent");
  revalidatePath("/app/conversations");
  return { status: "success", message: "Your test is ready to continue." };
}
