import type { FormState } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

export function FormFeedback({
  state,
  className,
}: {
  state: FormState;
  className?: string;
}) {
  if (!state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-4 py-3 text-sm leading-6",
        state.status === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
        className,
      )}
    >
      {state.message}
    </p>
  );
}
