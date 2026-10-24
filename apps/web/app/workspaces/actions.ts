"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { workspaceSchema } from "@avenlyo-app/shared";
import { z } from "zod";
import { requireUser } from "@/lib/workspace";
import type { FormState } from "../auth/actions";
async function selectCookie(id: string) {
  (await cookies()).set("avenlyo-app-workspace", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https:"),
    path: "/",
    maxAge: 2592000,
  });
}
export async function createWorkspace(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = workspaceSchema.safeParse({ name: form.get("name") });
  if (!parsed.success)
    return {
      status: "error",
      message: "Choose a business name between 2 and 100 characters.",
    };
  const result = await supabase.rpc("create_workspace", {
    business_name: parsed.data.name,
  });
  if (result.error || !result.data)
    return {
      status: "error",
      message: "Your workspace could not be created. Please try again.",
    };
  await selectCookie(result.data);
  redirect("/app");
}
export async function switchWorkspace(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  const id = z.uuid().safeParse(form.get("workspaceId"));
  if (!id.success)
    return { status: "error", message: "Choose an available workspace." };
  const result = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", id.data)
    .single();
  if (result.error)
    return {
      status: "error",
      message:
        "This workspace could not be opened. Refresh the list to check your access, then try again.",
    };
  await selectCookie(result.data.id);
  redirect("/app");
}
