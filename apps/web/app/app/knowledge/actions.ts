"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { knowledgeSchema } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { workspaceFormError } from "@/lib/workspace-form";
import { callApi } from "@/lib/api";
import type { FormState } from "@/app/auth/actions";
export async function saveKnowledge(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const workspaceError = workspaceFormError(form, ctx.workspace.id);
  if (workspaceError) return workspaceError;
  const parsed = knowledgeSchema.safeParse({
    type: form.get("type"),
    title: form.get("title"),
    content: form.get("content"),
  });
  const id = z
    .uuid()
    .nullable()
    .safeParse(form.get("id") || null);
  const revision = z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .safeParse(form.get("revision") || null);
  if (!parsed.success || !id.success || !revision.success)
    return {
      status: "error",
      message:
        "Add a title/question and content/answer within the shown limits.",
    };
  const result = await ctx.supabase.rpc("save_knowledge_item", {
    target_workspace_id: ctx.workspace.id,
    target_item_id: id.data,
    item_type: parsed.data.type,
    item_title: parsed.data.title,
    item_content: parsed.data.content,
    expected_revision: revision.data,
  });
  if (result.error || !result.data)
    return {
      status: "error",
      message:
        "Could not save this item. Check owner access or reload if someone edited it.",
    };
  revalidatePath("/app/knowledge");
  revalidatePath("/app");
  redirect(
    `/app/knowledge?notice=draft-saved&item=${result.data}#knowledge-${result.data}`,
  );
}
export async function knowledgeOperation(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const workspaceError = workspaceFormError(form, ctx.workspace.id);
  if (workspaceError) return workspaceError;
  const parsed = z
    .object({
      id: z.uuid(),
      intent: z.enum(["publish", "draft", "archived", "delete"]),
    })
    .safeParse({ id: form.get("id"), intent: form.get("intent") });
  if (!parsed.success)
    return { status: "error", message: "Invalid knowledge action." };
  const { id, intent } = parsed.data;
  if (intent === "publish") {
    const result = await callApi(`/v1/knowledge/${id}/publish`, {
      workspaceId: ctx.workspace.id,
    });
    if (result.status !== 200)
      return {
        status: "error",
        message:
          result.status === 409
            ? "This item changed while publishing. Refresh and review the latest draft before trying again."
            : result.status >= 500
              ? "Publication could not be confirmed. Refresh to check the current status before trying again. If it remains unavailable, contact your workspace administrator."
              : "This item could not be published. Check your owner access, then try again.",
      };
  } else {
    const result =
      intent === "delete"
        ? await ctx.supabase.rpc("delete_knowledge_item", {
            target_workspace_id: ctx.workspace.id,
            target_item_id: id,
          })
        : await ctx.supabase.rpc("change_knowledge_status", {
            target_workspace_id: ctx.workspace.id,
            target_item_id: id,
            target_status: intent,
          });
    if (result.error)
      return {
        status: "error",
        message: "Action failed. Only owners can change knowledge.",
      };
  }
  revalidatePath("/app/knowledge");
  revalidatePath("/app");
  if (intent === "delete") redirect("/app/knowledge?notice=deleted");
  const status =
    intent === "publish"
      ? "published"
      : intent === "archived"
        ? "archived"
        : "draft";
  const notice =
    intent === "publish"
      ? "published"
      : intent === "archived"
        ? "archived"
        : "unpublished";
  redirect(
    `/app/knowledge?status=${status}&notice=${notice}&item=${id}#knowledge-${id}`,
  );
}
