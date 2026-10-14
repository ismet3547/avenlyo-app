import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-3 text-3xl font-semibold">This page is unavailable</h1>
      <p className="mt-3 text-muted-foreground">
        It may not exist in your current workspace.
      </p>
      <Link
        className="mt-6 inline-block text-sm text-primary underline"
        href="/app"
      >
        Back to overview
      </Link>
    </main>
  );
}
