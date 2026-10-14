import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./apps/api/src/testing/browser",
  workers: 1,
  retries: 0,
  timeout: 90000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command:
        "pnpm --filter @avenlyo-app/api exec tsx src/testing/browser-server.ts",
      url: "http://127.0.0.1:4001/health",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "pnpm --filter @avenlyo-app/web start",
      url: "http://localhost:3001/auth/sign-in",
      reuseExistingServer: false,
      timeout: 60000,
      env: { SUPABASE_SERVICE_ROLE_KEY: "", OPENAI_API_KEY: "" },
    },
  ],
});
