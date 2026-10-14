"use server";
import { revalidatePath } from "next/cache";
import { workspaceSchema } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import type { FormState } from "@/app/auth/actions";
export async function renameBusiness(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const parsed = workspaceSchema.safeParse({ name: form.get("name") });
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter a business name between 2 and 100 characters.",
    };
  const result = await ctx.supabase.rpc("rename_workspace", {
    target_workspace_id: ctx.workspace.id,
    business_name: parsed.data.name,
  });
  if (result.error)
    return {
      status: "error",
      message: "Could not save. Workspace owner access is required.",
    };
  revalidatePath("/app", "layout");
  return { status: "success", message: "Business name saved." };
}
