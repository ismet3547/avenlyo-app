export default function Loading() {
  return (
    <div role="status" aria-label="Loading workspace" className="space-y-5">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-border" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-border" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div className="h-40 animate-pulse rounded-xl bg-border/50" key={n} />
        ))}
      </div>
    </div>
  );
}
