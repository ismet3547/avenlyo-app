import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import type { Database } from "@avenlyo-app/shared";

test("optional channel completion survives login and changes READY to LIVE only after real activation", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:55321");
  const admin = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const email = `optional-channel-${randomUUID()}@example.test`;
  const password = `Local-optional-${randomUUID()}!`;
  expect(
    (
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
    ).error,
  ).toBeNull();
  const staff = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  expect(
    (await staff.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  const signIn = async () => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  };
  const readyHome = async () => {
    const home = page.locator(".operational-home");
    await expect(page).toHaveURL(/\/app$/);
    await expect(
      page.getByRole("heading", {
        name: "Your front office is ready",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Connect a channel when you’re ready to start receiving customer conversations.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Connect channel" }),
    ).toBeVisible();
    await expect(
      page.locator(".home-section, .home-alert, .home-list"),
    ).toHaveCount(0);
    await expect(home.getByRole("alert")).toHaveCount(0);
    await expect(
      home.getByRole("link", { name: "Open Inbox", exact: true }),
    ).toHaveCount(0);
  };
  await signIn();
  await expect(page).toHaveURL(/\/workspaces$/);
  await page.getByLabel("Business name", { exact: true }).fill("Ready Studio");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("button", { name: "Set up later" })).toHaveCount(
    0,
  );
  await page
    .getByLabel("What should your agent help customers with?", { exact: true })
    .fill("Help customers understand our design services and reach our team.");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await page.getByRole("button", { name: /Add manually/ }).click();
  await page.getByLabel("Title", { exact: true }).fill("Design services");
  await page
    .getByLabel("Content", { exact: true })
    .fill(
      "We offer custom logo and website design. Share your project scope to discuss suitable options.",
    );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(
    /\/onboarding\?step=knowledge&item=[a-f0-9-]{36}$/,
  );
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Continue to test" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continue to test" }).click();
  await page
    .getByLabel("Message your agent", { exact: true })
    .fill("What services do you offer?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.getByRole("link", { name: "Looks good, continue" }).click();
  await expect(page.getByText("Optional", { exact: true })).toBeVisible();
  const primary = page.getByRole("button", {
    name: "Prepare Website Chat",
    exact: true,
  });
  const skip = page.getByRole("button", { name: "Set up later", exact: true });
  await expect(skip).toBeVisible();
  expect((await skip.boundingBox())!.y).toBeGreaterThanOrEqual(
    (await primary.boundingBox())!.y + (await primary.boundingBox())!.height,
  );
  // The same escape remains available while viewing managed Instagram setup.
  await page.getByRole("button", { name: "Instagram", exact: true }).click();
  await expect(skip).toBeVisible();
  await page.getByRole("button", { name: "Website Chat", exact: true }).click();
  const shots = "test-results/screenshots";
  await mkdir(shots, { recursive: true });
  await page.screenshot({
    path: `${shots}/onboarding-optional-channel-desktop.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${shots}/onboarding-optional-channel-mobile.png`,
    fullPage: true,
  });
  // No approved origin is entered; skipping is a separate form, not channel setup.
  await skip.click();
  await readyHome();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  const readWorkspace = () => staff.from("workspaces").select("*").single();
  const skipped = await readWorkspace();
  expect(skipped.error).toBeNull();
  expect(skipped.data!.onboarding_completed_at).not.toBeNull();
  expect(skipped.data!.first_channel_activated_at).toBeNull();
  const workspaceId = skipped.data!.id;
  const untouched = await staff
    .from("channel_connections")
    .select("*")
    .eq("workspace_id", workspaceId);
  expect(untouched.error).toBeNull();
  expect(untouched.data).toEqual([]);
  const progress = await staff.rpc("sync_onboarding", {
    target_workspace_id: workspaceId,
  });
  expect(progress.error).toBeNull();
  expect(progress.data).toMatchObject({
    configured: true,
    published: true,
    tested: true,
    connected: false,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await signIn();
  await readyHome();
  await page.reload();
  await readyHome();
  const persisted = await readWorkspace();
  expect(persisted.data!.onboarding_completed_at).toBe(
    skipped.data!.onboarding_completed_at,
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const path = `${shots}/home-ready-${width}.png`;
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`READY Home ${width}`, {
      path,
      contentType: "image/png",
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("link", { name: "Connect channel", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/channels$/);
  await expect(page.getByText("Not connected", { exact: true })).toHaveCount(2);
  await page
    .getByLabel("Approved websites", { exact: true })
    .fill("https://ready.example");
  await page.getByRole("checkbox", { name: "Enable Website Chat" }).check();
  await page.getByRole("button", { name: "Save channel", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ready");
  await page.goto("/app");
  await expect(
    page.getByRole("heading", {
      name: "Your front office is live",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Needs your attention", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".operational-home")
      .getByRole("link", { name: "Open Inbox", exact: true }),
  ).toBeVisible();
  const live = await readWorkspace();
  expect(live.data!.first_channel_activated_at).not.toBeNull();
  expect(live.data!.onboarding_completed_at).toBe(
    skipped.data!.onboarding_completed_at,
  );
  const connected = await staff
    .from("channel_connections")
    .select("*")
    .eq("workspace_id", workspaceId);
  expect(connected.error).toBeNull();
  expect(connected.data).toHaveLength(1);
  expect(connected.data![0]).toMatchObject({
    channel: "website_chat",
    enabled: true,
    last_activity_at: null,
  });
  // Losing a formerly active channel is operational, even with no prior traffic.
  expect(
    (
      await staff.rpc("configure_website_channel", {
        target_workspace_id: workspaceId,
        channel_enabled: false,
        origins: ["https://ready.example"],
      })
    ).error,
  ).toBeNull();
  await page.reload();
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", {
      name: "Your front office needs attention",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".operational-home").getByRole("alert"),
  ).toBeVisible();
});
