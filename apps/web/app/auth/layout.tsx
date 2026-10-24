import type { ReactNode } from "react";
import { Sparkles, BookOpen, MessageSquare, ArrowUpRight } from "lucide-react";
export const dynamic = "force-dynamic";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#edeefb] p-14 lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-white">
            <Sparkles className="size-4" aria-hidden />
          </span>
          Avenlyo
        </div>
        <div className="my-auto max-w-lg py-16">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">
            A clearer front office
          </p>
          <h2 className="mt-5 text-5xl font-semibold leading-[1.12] tracking-[-.05em]">
            Good questions.
            <br />
            Useful answers.
            <br />
            <span className="text-primary">Real opportunities.</span>
          </h2>
          <p className="mt-6 max-w-sm text-base leading-7 text-muted-foreground">
            Give Avenlyo your business knowledge. Help customers understand your
            services and take the next step.
          </p>
          <div className="mt-10 space-y-4 text-sm">
            <p className="flex items-center gap-3">
              <BookOpen className="size-4 text-primary" aria-hidden />
              Knowledge you control
            </p>
            <p className="flex items-center gap-3">
              <MessageSquare className="size-4 text-primary" aria-hidden />
              Helpful, bounded conversations
            </p>
            <p className="flex items-center gap-3">
              <ArrowUpRight className="size-4 text-primary" aria-hidden />
              Inquiries your team can act on
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your business. Your knowledge. Your team.
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="mb-10 text-xl font-semibold lg:hidden">Avenlyo</p>
          {children}
        </div>
      </section>
    </main>
  );
}
