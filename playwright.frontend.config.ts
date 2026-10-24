import { defineConfig } from "@playwright/test";
// These fixtures test UI behavior, not Auth/RLS or provider integration.
const env = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55431",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_frontend_fixture_only",
  NEXT_PUBLIC_APP_URL: "http://localhost:3001",
  AVENLYO_APP_API_URL: "http://127.0.0.1:55431",
  AVENLYO_PUBLIC_API_URL: "http://localhost:4001",
  SUPABASE_SERVICE_ROLE_KEY: "",
  OPENAI_API_KEY: "",
  NEXT_TELEMETRY_DISABLED: "1",
};
export default defineConfig({
  testDir: "./apps/web/testing",
  workers: 1,
  timeout: 30000,
  reporter: [["list"]],
  outputDir: "test-results/frontend",
  use: {
    baseURL: "http://localhost:3001",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
    },
  },
  webServer: [
    {
      command: "node apps/web/testing/start-server.mjs",
      url: "http://127.0.0.1:55431/health",
      reuseExistingServer: false,
    },
    {
      command:
        process.env.FRONTEND_USE_EXISTING_BUILD === "1"
          ? "pnpm --filter @avenlyo-app/web start"
          : "pnpm --filter @avenlyo-app/web build && pnpm --filter @avenlyo-app/web start",
      url: "http://localhost:3001/auth/sign-in",
      reuseExistingServer: false,
      timeout: 120000,
      env,
    },
  ],
});
