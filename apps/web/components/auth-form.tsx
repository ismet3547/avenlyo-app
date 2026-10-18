"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="mt-7 space-y-5">
      <label className="block text-sm font-medium">
        Email
        <Input
          className="mt-2"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </label>
      <div className="text-sm font-medium">
        <label htmlFor="auth-password">Password</label>
        <span className="relative mt-2 block">
          <Input
            className="pr-12"
            id="auth-password"
            name="password"
            type={showPassword ? "text" : "password"}
            minLength={8}
            maxLength={128}
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            placeholder={
              mode === "sign-in" ? "Your password" : "At least 8 characters"
            }
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-0 top-0 grid size-11 place-items-center rounded-r-lg text-muted-foreground"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </span>
      </div>
      {!configured && (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Sign-in is temporarily unavailable. Please try again later.
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
