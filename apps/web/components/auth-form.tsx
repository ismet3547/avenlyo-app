"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signIn, signUp, type FormState } from "@/app/auth/actions";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function AuthForm({
  mode,
  configured,
}: {
  mode: "sign-in" | "sign-up";
  configured: boolean;
}) {
  const [state, action, pending] = useActionState(
    mode === "sign-in" ? signIn : signUp,
    { message: "", status: "idle" } as FormState,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form action={action} className="mt-7 space-y-5">
      <label className="block text-sm font-medium">
        Email
        <Input
          className="mt-2"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          maxLength={254}
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <Input
          className="mt-2"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          minLength={8}
          maxLength={128}
          autoComplete={
            mode === "sign-in" ? "current-password" : "new-password"
          }
          placeholder="At least 8 characters"
          aria-describedby="password-help"
          required
        />
      </label>
      <p id="password-help" className="text-xs text-muted-foreground">
        Use at least 8 characters.
      </p>
      {!configured && (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Sign-in is temporarily unavailable. Please try again later or contact
          your administrator.
        </p>
      )}
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-lg p-3 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
        >
          {state.message}
        </p>
      )}
      <Button
        disabled={pending || !configured}
        className="w-full"
        type="submit"
      >
        {pending
          ? "Please wait…"
          : mode === "sign-in"
            ? "Sign in"
            : "Create account"}
        <ArrowRight aria-hidden />
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "sign-in" ? "New to Avenlyo?" : "Already have an account?"}{" "}
        <Link
          className="font-medium text-primary hover:underline"
          href={mode === "sign-in" ? "/auth/sign-up" : "/auth/sign-in"}
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
