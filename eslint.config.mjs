import js from "@eslint/js";
import ts from "typescript-eslint";

export default ts.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        fetch: "readonly",
        URL: "readonly",
        AbortSignal: "readonly",
      },
    },
  },
);
