import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
export const dynamic = "force-dynamic";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Brand />
        <div className="my-auto max-w-lg py-16">
          <p className="mb-6 text-xs text-white/60">
            Customer conversations, managed.
          </p>
          <h2 className="text-[clamp(42px,4vw,64px)] font-medium leading-[1.06] tracking-[-.055em]">
            Every conversation.
            <br />
            One workspace.
          </h2>
          <p className="mt-7 max-w-sm text-sm leading-7 text-white/65">
            Website and Instagram messages, business knowledge, and your team in
            one place.
          </p>
        </div>
      </section>
      <section className="auth-content">
        <div className="w-full max-w-[360px]">
          <div className="mb-12 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
