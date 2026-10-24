import Link from "next/link";
import { Button } from "./ui/button";
export const PAGE_SIZE = 20;
export function pageNumber(value?: string) {
  return /^\d+$/.test(value ?? "") ? Math.min(2000, Number(value)) : 0;
}
export function Pagination({
  pathname,
  page,
  total,
  pageSize = PAGE_SIZE,
  filters = {},
}: {
  pathname: string;
  page: number;
  total: number;
  pageSize?: number;
  filters?: Record<string, string | undefined>;
}) {
  function href(next: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value && value !== "all") params.set(key, value);
    if (next) params.set("page", String(next));
    return `${pathname}${params.size ? `?${params}` : ""}`;
  }
  if (!total && !page) return null;
  return (
    <nav
      aria-label="Results pages"
      className="mt-5 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-xs text-muted-foreground">
        {total
          ? `${Math.min(page * pageSize + 1, total)}–${Math.min((page + 1) * pageSize, total)} of ${total}`
          : "No results on this page"}
      </p>
      <div className="flex gap-2">
        {page > 0 && (
          <Button asChild variant="outline" size="sm">
            <Link href={href(page - 1)}>Previous</Link>
          </Button>
        )}
        {(page + 1) * pageSize < total && (
          <Button asChild variant="outline" size="sm">
            <Link href={href(page + 1)}>Next</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
