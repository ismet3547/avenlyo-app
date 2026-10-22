export default function Loading() {
  return (
    <div role="status" aria-label="Loading workspace">
      <div className="skeleton-block" style={{ width: 230, height: 30 }} />
      <div className="skeleton-block" style={{ width: "70%", marginTop: 18 }} />
      <div className="loading-grid">
        {[0, 1, 2, 3].map((i) => (
          <div className="panel loading-card" key={i}>
            <div className="skeleton-block" />
            <div
              className="skeleton-block"
              style={{ width: "50%", height: 35 }}
            />
          </div>
        ))}
      </div>
      <div className="panel" style={{ padding: 30, marginTop: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            className="skeleton-block"
            key={i}
            style={{ marginBottom: 25, width: `${95 - i * 10}%` }}
          />
        ))}
      </div>
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
