"use client";
export default function ErrorState({ reset }: { reset: () => void }) {
  return (
    <div className="knowledge-load-error">
      <h1>Knowledge couldn’t be loaded.</h1>
      <p>Try again in a moment.</p>
      <button className="button button-primary" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
