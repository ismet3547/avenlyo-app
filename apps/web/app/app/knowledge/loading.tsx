export default function Loading() {
  return (
    <div
      className="knowledge-loading"
      role="status"
      aria-label="Loading knowledge"
    >
      <span className="sr-only">Loading knowledge…</span>
      <div className="skeleton-block" style={{ width: 220, height: 32 }} />
      {[0, 1, 2, 3].map((i) => (
        <div className="knowledge-loading-row" key={i}>
          <div
            className="skeleton-block"
            style={{ width: "55%", height: 18 }}
          />
          <div
            className="skeleton-block"
            style={{ width: "30%", height: 14 }}
          />
        </div>
      ))}
    </div>
  );
}
