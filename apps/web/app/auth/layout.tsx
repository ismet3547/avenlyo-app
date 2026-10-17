import type { ReactNode } from "react";
import { BookOpen, MessageSquare, UserRound } from "lucide-react";
import { Brand } from "@/components/brand";
export const dynamic = "force-dynamic";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen flex-col border-r border-border bg-muted p-12 lg:flex xl:p-16">
        <Brand />
        <div className="my-auto max-w-lg py-16">
          <p className="eyebrow text-primary">Your AI front office</p>
          <h1 className="mt-6 text-[46px] font-medium leading-[1.13] tracking-[-.045em] xl:text-[54px]">
            Good questions.
            <br />
            Useful answers.
            <br />
            <span className="text-primary">Real opportunities.</span>
          </h1>
          <p className="mt-6 max-w-sm text-[15px] leading-7 text-muted-foreground">
            Give Avenlyo your business knowledge. Help customers understand your
            services, then let your team take the conversation forward.
          </p>
          <div className="mt-9 space-y-4 border-t border-border pt-7">
            {[
              { icon: BookOpen, label: "Knowledge you control" },
              { icon: MessageSquare, label: "Clear, useful conversations" },
              { icon: UserRound, label: "Your team, when it matters" },
            ].map(({ icon: Icon, label }) => (
              <p className="flex items-center gap-3 text-[13px]" key={label}>
                <Icon aria-hidden className="size-4 text-primary" />
                {label}
              </p>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your business. Your knowledge. Your team.
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-card px-6 py-12">
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
