import { AuthForm } from "@/components/auth-form";
import { authConfigured } from "@/lib/supabase/server";
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Sign in to your AI front office.
      </p>
      {notice === "confirmation-failed" && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          This confirmation link could not be verified. Try signing in if you
          have already confirmed your email, or use the latest confirmation
          email.
        </p>
      )}
      <AuthForm mode="sign-in" configured={authConfigured()} />
    </>
  );
}
