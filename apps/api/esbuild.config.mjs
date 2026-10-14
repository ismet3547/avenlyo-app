import { build } from "esbuild";
import { fileURLToPath } from "node:url";
await build({
  entryPoints: ["src/server.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
  outdir: "dist",
  external: [],
  plugins: [
    {
      name: "bundle-shared",
      setup(b) {
        b.onResolve({ filter: /^@avenlyo-app\/shared$/ }, () => ({
          path: fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url)),
        }));
      },
    },
  ],
});
