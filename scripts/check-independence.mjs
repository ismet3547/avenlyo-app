import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
const root = process.cwd();
const ignored = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  ".temp",
  ".branches",
  "coverage",
  "docs",
  "test-results",
  "playwright-report",
]);
const violations = [];
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      ignored.has(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name === "check-independence.mjs"
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (/\.(tsx?|[cm]?js|json|ya?ml|toml|sql)$/.test(entry.name)) {
      const content = await readFile(path, "utf8");
      if (
        /@avenlyo\//.test(content) ||
        /(?:github\.com[/:]ismet3547\/Avenlyo(?:[/."'\s]|$)|api(?:-staging)?\.avenlyo\.com)/i.test(
          content,
        )
      )
        violations.push(relative(root, path));
    }
  }
}
await visit(root);
if (violations.length) {
  console.error(
    "Legacy dependencies or API URLs are not permitted:",
    violations.join(", "),
  );
  process.exitCode = 1;
} else
  console.info(
    "Independence check passed: no legacy packages, repository dependencies or API URLs.",
  );
