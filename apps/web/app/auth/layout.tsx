import type { ReactNode } from "react";
import { BookOpen, ArrowUpRight, MessageCircle } from "lucide-react";
import { Brand } from "@/components/brand";
export const dynamic = "force-dynamic";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div className="relative z-1">
          <Brand />
        </div>
        <div className="relative z-1 my-auto max-w-xl py-14">
          <p className="eyebrow !text-primary">A more human front office</p>
          <h2 className="mt-5 text-[clamp(40px,4vw,60px)] font-medium leading-[1.1] tracking-[-.055em]">
            A warmer welcome.
            <br />A clearer
            <br />
            <span className="text-primary">next step.</span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
            Help customers understand your business. Give your team the context
            to continue the conversation.
          </p>
          <div className="mt-10 max-w-sm space-y-3 text-xs">
            <p className="flex items-center gap-3">
              <BookOpen className="size-4 text-primary" aria-hidden />
              Answers grounded in knowledge you publish
            </p>
            <p className="flex items-center gap-3">
              <MessageCircle className="size-4 text-primary" aria-hidden />
              Website and Instagram conversations in one place
            </p>
            <p className="flex items-center gap-3">
              <ArrowUpRight className="size-4 text-primary" aria-hidden />A
              clear handoff when your team is needed
            </p>
          </div>
        </div>
        <p className="relative z-1 text-[11px] text-muted-foreground">
          Your business. Your knowledge. Your team.
        </p>
      </section>
      <section className="auth-content">
        <div className="w-full max-w-[360px]">
          <div className="mb-14 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
        <p className="mt-14 text-center text-[11px] text-muted-foreground">
          A little clarity for every conversation.
        </p>
      </section>
    </main>
  );
}
