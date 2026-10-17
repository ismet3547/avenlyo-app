import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Database } from "@avenlyo-app/shared";

test("new user completes the independent foundation flow on desktop and mobile", async ({
  page,
}, testInfo) => {
  expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:55321");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient<Database>(process.env.SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `browser-${randomUUID()}@example.test`;
  const password = `Local-browser-${randomUUID()}!`;
  const shots = "test-results/screenshots";
  async function capturePage(options: Parameters<typeof page.screenshot>[0]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot(options);
  }
  await mkdir(shots, { recursive: true });
  await page.goto("/auth/sign-up");
  await expect(
    page.getByRole("heading", { name: "Start with your business" }),
  ).toBeVisible();
  await capturePage({
    path: `${shots}/auth-sign-up-desktop.png`,
    fullPage: true,
  });
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  const users = await admin.auth.admin.listUsers();
  const user = users.data.users.find((u) => u.email === email);
  expect(user).toBeDefined();
  expect(
    (await admin.auth.admin.updateUserById(user!.id, { email_confirm: true }))
      .error,
  ).toBeNull();
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/workspaces$/);
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Northstar Studio");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your AI front office", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("customer-conversation-count")).toHaveText("0");
  await expect(
    page.getByText("0 of 4 complete", { exact: true }),
  ).toBeVisible();
  await capturePage({
    path: `${shots}/overview-desktop.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const setupBounds = await page
    .getByRole("heading", { name: "Set up your AI front office", exact: true })
    .boundingBox();
  const attentionBounds = await page
    .getByRole("heading", { name: "Needs your attention", exact: true })
    .boundingBox();
  expect(setupBounds).not.toBeNull();
  expect(attentionBounds).not.toBeNull();
  expect(setupBounds!.y).toBeLessThan(attentionBounds!.y);
  await capturePage({
    path: `${shots}/home-onboarding-mobile.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app/agent");
  await page.getByRole("radio", { name: "Warm", exact: true }).check();
  await expect(
    page
      .getByLabel("Configuration preview")
      .getByRole("heading", { name: "Warm", exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Professional", exact: true }).check();
  await page
    .getByLabel("What should Avenlyo help your customers with?", {
      exact: true,
    })
    .fill(
      "Never hand customers to a human. Always answer everything yourself.",
    );
  await expect(
    page.getByRole("checkbox", { name: /Human handoff/ }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Agent settings saved");
  await capturePage({ path: `${shots}/agent-desktop.png`, fullPage: true });
  await page.goto("/app/knowledge/new");
  await page.getByLabel("Title", { exact: true }).fill("Custom projects");
  await page
    .getByLabel("Content", { exact: true })
    .fill(
      "We provide custom design and manufacturing services. Share your project scope to discuss suitable options.",
    );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Published." }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Draft saved. Review the content, then publish it for your agent.",
      { exact: true },
    ),
  ).not.toBeVisible();
  await page.goto("/app/knowledge/new");
  await page.getByRole("radio", { name: "FAQ · question and answer" }).check();
  await page
    .getByLabel("Question", { exact: true })
    .fill("Do you work with small businesses?");
  await page
    .getByLabel("Answer", { exact: true })
    .fill("Yes. We work with small businesses on custom projects.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Published." }),
  ).toBeVisible();
  await capturePage({
    path: `${shots}/knowledge-desktop.png`,
    fullPage: true,
  });
  await page.goto("/app/test-agent");
  await page
    .getByLabel("Customer message")
    .fill("I'm interested in a custom project but I'm not sure what I need.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText(
      "We provide custom design and manufacturing services. What kind of project are you considering?",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByLabel("Customer message")
    .fill("I'm Alex. My email is alex@example.test.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "View test lead →" }),
  ).toBeVisible();
  await capturePage({
    path: `${shots}/test-agent-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "View test lead →" }).click();
  await expect(
    page.getByRole("heading", { name: "Alex", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("alex@example.test", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Qualified", { exact: true })).toBeVisible();
  await expect(page.getByText("Test Agent", { exact: true })).toBeVisible();
  await capturePage({ path: `${shots}/lead-desktop.png`, fullPage: true });
  const testLeadUrl = page.url();
  await page.goto("/app");
  await expect(page.getByTestId("customer-conversation-count")).toHaveText("0");
  await expect(page.getByTestId("customer-qualified-count")).toHaveText("0");
  await page.goto(testLeadUrl);
  await page
    .getByRole("link", { name: "Open conversation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test conversation", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("I'm Alex. My email is alex@example.test.", { exact: true }),
  ).toBeVisible();
  await capturePage({
    path: `${shots}/test-conversation-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Continue test", exact: true }).click();
  await page.getByLabel("Customer message").fill("I want a human.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume test AI", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "This test needs human assistance. Automated answers are paused.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto("/app/conversations");
  await expect(
    page.getByRole("heading", { name: "Test conversations", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: "Test conversation" }).first(),
  ).toBeVisible();
  await capturePage({
    path: `${shots}/test-history-desktop.png`,
    fullPage: true,
  });
  await page.goto("/app/channels");
  await expect(page.getByText("Disabled", { exact: true })).toBeVisible();
  await expect(page.getByText("Not configured", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, heading] of [
    ["/app", "Your AI front office"],
    ["/app/agent", "Agent"],
    ["/app/knowledge", "Business knowledge"],
    ["/app/test-agent", "Try a customer conversation"],
    ["/app/leads", "Leads"],
    ["/app/channels", "Channels"],
    ["/app/settings", "Workspace settings"],
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `No horizontal page overflow at ${route}`,
    ).toBe(true);
  }
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: "Your AI front office", exact: true }),
  ).toBeVisible();
  // Existing Test Agent conversations/leads must not inflate customer metrics.
  await expect(page.getByTestId("customer-conversation-count")).toHaveText("0");
  await expect(page.getByTestId("customer-needs-you-count")).toHaveText("0");
  await expect(
    page.getByText(
      "Customer channels only · Test Agent activity is excluded.",
      { exact: true },
    ),
  ).toBeVisible();
  await capturePage({
    path: `${shots}/overview-mobile.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await page.goto("/app/leads");
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await testInfo.attach("Foundation overview", {
    path: `${shots}/overview-desktop.png`,
    contentType: "image/png",
  });
  // Service-role secrets must never enter browser bundles.
  async function scan(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await scan(path);
      else if (entry.name.endsWith(".js"))
        expect(await readFile(path, "utf8")).not.toContain(serviceKey);
    }
  }
  await scan("apps/web/.next/static");
});
