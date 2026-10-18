import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-mark", className)} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="m7 23 7.4-15h3.2L25 23h-4.3L16 13l-4.7 10H7Z"
          fill="currentColor"
        />
        <path d="M12.3 21h7.4" stroke="currentColor" strokeWidth="2.6" />
      </svg>
    </span>
  );
}
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/app"
      className={cn("brand", className)}
      aria-label="Avenlyo home"
    >
      <BrandMark />
      <span>avenlyo.</span>
    </Link>
  );
}
