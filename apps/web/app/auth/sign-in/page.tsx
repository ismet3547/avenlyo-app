import Link from "next/link";
import { AuthForm } from "@/components/product-forms";
export default function Page() {
  return (
    <div className="auth-form-card">
      <p className="eyebrow">A CLEARER DAY STARTS HERE</p>
      <h1>Welcome back.</h1>
      <p>Sign in to your Avenlyo workspace.</p>
      <AuthForm mode="signin" />
      <div className="auth-bottom">
        New to Avenlyo?<Link href="/auth/sign-up">Create an account</Link>
      </div>
      <div className="auth-note">
        Your conversations. Your knowledge. Your workspace.
      </div>
    </div>
  );
}
