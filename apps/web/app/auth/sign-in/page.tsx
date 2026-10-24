import Link from "next/link";
import { AuthForm } from "@/components/product-forms";
export default function Page() {
  return (
    <div className="auth-form-card">
      <h1>Sign in to Avenlyo</h1>
      <p>Sign in to your Avenlyo workspace.</p>
      <AuthForm mode="signin" />
      <div className="auth-bottom">
        New to Avenlyo?<Link href="/auth/sign-up">Create an account</Link>
      </div>
    </div>
  );
}
