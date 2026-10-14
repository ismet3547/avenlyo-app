import "server-only";
import { createSupabase } from "./supabase/server";
export async function callApi(
  path: string,
  body: unknown,
): Promise<{ status: number; data: unknown }> {
  const supabase = await createSupabase();
  if (!supabase)
    return { status: 503, data: { code: "BACKEND_NOT_CONFIGURED" } };
  const verified = await supabase.auth.getUser();
  if (verified.error || !verified.data.user)
    return { status: 401, data: { code: "UNAUTHORIZED" } };
  // The raw token is forwarded only after a fresh verification, never used as an identity claim.
  const session = await supabase.auth.getSession();
  if (!session.data.session)
    return { status: 401, data: { code: "UNAUTHORIZED" } };
  try {
    const response = await fetch(
      new URL(path, process.env.AVENLYO_APP_API_URL ?? "http://127.0.0.1:4001"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(45000),
      },
    );
    return { status: response.status, data: await response.json() };
  } catch {
    return { status: 503, data: { code: "API_UNAVAILABLE" } };
  }
}
