import Link from "next/link";
import { cn } from "@/lib/utils";
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/app"
      aria-label="Avenlyo home"
      className={cn(
        "inline-flex items-center gap-2.5 text-[23px] font-semibold tracking-[-.06em] text-foreground",
        className,
      )}
    >
      <svg
        aria-hidden
        className="size-7 text-primary"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path d="m5 26 9-21h4l9 21h-5l-6-15-6 15H5Z" fill="currentColor" />
        <path d="M11 20h10v3H11z" fill="currentColor" />
      </svg>
      <span>avenlyo</span>
    </Link>
  );
}
