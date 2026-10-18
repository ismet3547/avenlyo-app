import { AuthForm } from "@/components/auth-form";
import { authConfigured } from "@/lib/supabase/server";
export default function SignUpPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">
        Create an account
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Create an account, add knowledge, and test your agent. A website is
        optional.
      </p>
      <AuthForm mode="sign-up" configured={authConfigured()} />
    </>
  );
}
