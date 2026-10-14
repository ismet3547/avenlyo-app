"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWorkspace } from "@/lib/workspace";
export async function resumeTest(form: FormData) {
  const ctx = await requireWorkspace();
  const id = z.uuid().safeParse(form.get("conversationId"));
  if (!id.success) return;
  await ctx.supabase.rpc("resume_test_conversation", {
    target_workspace_id: ctx.workspace.id,
    target_conversation_id: id.data,
  });
  revalidatePath("/app/test-agent");
  revalidatePath("/app/conversations");
}
