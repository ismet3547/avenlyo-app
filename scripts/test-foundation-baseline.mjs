// Run the existing Foundation acceptance against its historical runtime before
// upgrading the disposable schema. Current runtime requires persisted Agents.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
if (process.env.SUPABASE_URL !== "http://127.0.0.1:55321")
  throw Error("Disposable local stack required");
const path = "apps/api/src/runtime/agent.ts",
  current = readFileSync(path);
try {
  writeFileSync(
    path,
    execFileSync("git", [
      "show",
      "252ba345da591752f5de18e9088bc8a4b0893b9e:apps/api/src/runtime/agent.ts",
    ]),
  );
  const result = spawnSync("pnpm", ["test:acceptance"], { stdio: "inherit" });
  if (result.status !== 0) process.exitCode = 1;
} finally {
  writeFileSync(path, current);
}
