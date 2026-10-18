export default function Loading() {
  return (
    <div role="status" aria-label="Loading workspace" className="space-y-7">
      <span className="sr-only">Loading your workspace…</span>
      <div aria-hidden="true" className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-border" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded-lg bg-border" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-border/60" />
      </div>
      <div
        aria-hidden="true"
        className="h-48 animate-pulse rounded-2xl border border-border bg-muted"
      />
      <div
        aria-hidden="true"
        className="rounded-2xl border border-border bg-white p-6"
      >
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="flex items-center gap-4 border-b border-border py-5 last:border-0"
          >
            <div className="size-9 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
