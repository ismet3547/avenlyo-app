import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabase } from "./supabase/server";
export async function requireUser() {
  const supabase = await createSupabase();
  if (!supabase) redirect("/auth/sign-in");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/auth/sign-in");
  return { supabase, user: data.user };
}
export async function requireWorkspace() {
  const { supabase, user } = await requireUser();
  const spaces = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at");
  if (spaces.error) throw new Error("Workspace could not be loaded");
  if (!spaces.data.length) redirect("/workspaces");
  const selected = (await cookies()).get("avenlyo-app-workspace")?.value;
  const workspace =
    spaces.data.find((w) => w.id === selected) ?? spaces.data[0];
  const member = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("active", true)
    .single();
  if (member.error) redirect("/workspaces");
  return {
    supabase,
    user,
    workspace,
    workspaces: spaces.data,
    role: member.data.role,
  };
}
