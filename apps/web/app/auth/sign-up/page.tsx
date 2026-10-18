import Link from "next/link";
import { AuthForm } from "@/components/product-forms";
export default function Page() {
  return (
    <div className="auth-form-card">
      <p className="eyebrow">LET’S MAKE ROOM FOR BETTER</p>
      <h1>A fresh start for your front office.</h1>
      <p>Create your account. Make your agent your own.</p>
      <AuthForm mode="signup" />
      <div className="auth-bottom">
        Already have an account?<Link href="/auth/sign-in">Sign in</Link>
      </div>
      <div className="auth-note">
        After confirming your email, you can create your workspace.
      </div>
    </div>
  );
}
