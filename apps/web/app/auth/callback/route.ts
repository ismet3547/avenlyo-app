import { NextResponse } from "next/server";
import { createSupabase } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  const supabase = await createSupabase();
  if (
    code &&
    supabase &&
    !(await supabase.auth.exchangeCodeForSession(code)).error
  )
    return NextResponse.redirect(
      new URL(
        "/workspaces",
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
      ),
    );
  return NextResponse.redirect(
    new URL(
      "/auth/sign-in?notice=confirmation-failed",
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
    ),
  );
}
