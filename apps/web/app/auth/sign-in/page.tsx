import { AuthForm } from "@/components/auth-form";
import { authConfigured } from "@/lib/supabase/server";
export default function SignInPage() {
  return (
    <>
      <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Sign in to your AI front office.
      </p>
      <AuthForm mode="sign-in" configured={authConfigured()} />
    </>
  );
}
