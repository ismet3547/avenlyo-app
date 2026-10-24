"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";
import { createSupabase } from "@/lib/supabase/server";
export type FormState = {
  message: string;
  status: "idle" | "error" | "success";
};
const credentials = z.object({
  email: z.string().trim().pipe(z.email().max(254)),
  password: z.string().min(8).max(128),
});
export async function signIn(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter a valid email and password of at least 8 characters.",
    };
  const supabase = await createSupabase();
  if (!supabase)
    return {
      status: "error",
      message:
        "Sign-in is temporarily unavailable. Please try again later or contact your administrator.",
    };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      status: "error",
      message:
        "We could not sign you in. Check your credentials and email confirmation.",
    };
  redirect("/app");
}
export async function signUp(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter a valid email and password of at least 8 characters.",
    };
  const supabase = await createSupabase();
  if (!supabase)
    return {
      status: "error",
      message:
        "Sign-in is temporarily unavailable. Please try again later or contact your administrator.",
    };
  const origin = new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  ).origin;
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error)
    return {
      status: "error",
      message:
        "We could not create your account. Try signing in or checking your email.",
    };
  if (data.session) redirect("/workspaces");
  return {
    status: "success",
    message:
      "Check your email to confirm your account, then return here to sign in.",
  };
}
export async function signOut() {
  const supabase = await createSupabase();
  if (supabase) await supabase.auth.signOut();
  (await cookies()).delete("avenlyo-app-workspace");
  redirect("/auth/sign-in");
}
