import Link from "next/link";
import { AuthForm } from "@/components/product-forms";
export default function Page() {
  return (
    <div className="auth-form-card">
      <h1>Create your account</h1>
      <p>Get started with your customer workspace.</p>
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
