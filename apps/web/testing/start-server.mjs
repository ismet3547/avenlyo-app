import ts from "typescript";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const output = new URL("../../../test-results/fixtures/", import.meta.url);
await mkdir(output, { recursive: true });
for (const name of ["fixture", "server"]) {
  const source = await readFile(
    new URL(`./${name}.ts`, import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
  await writeFile(
    new URL(`${name}.mjs`, output),
    code.replace('"./fixture.ts"', '"./fixture.mjs"'),
  );
}
await import(new URL("server.mjs", output).href);
