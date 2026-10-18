import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import type { Database } from "@avenlyo-app/shared";
test("anonymous website visitor, real Inbox handoff and human reply work on desktop and mobile", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(120000);
  expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:55321");
  const admin = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const email = `channels-browser-${randomUUID()}@example.test`,
    password = `Fictional-browser-${randomUUID()}!`;
  expect(
    (
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
    ).error,
  ).toBeNull();
  await mkdir("test-results/screenshots", { recursive: true });
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
  await page.goto("/app/knowledge/new");
  await page.getByLabel("Title", { exact: true }).fill("Logo design");
  await page
    .getByLabel("Content", { exact: true })
    .fill(
      "We provide logo design for small businesses. Share your design project scope to discuss suitable options.",
    );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Published." }),
  ).toBeVisible();
  await page.goto("/app/channels");
  await expect(page.getByText("Disabled", { exact: true })).toBeVisible();
  await expect(page.getByText("Not configured", { exact: true })).toBeVisible();
  await page
    .getByLabel("Approved website origins")
    .fill("http://localhost:3001");
  await page.getByRole("checkbox", { name: "Enable Website Chat" }).check();
  await page
    .getByRole("button", { name: "Save Website Chat", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ready");
  await expect(page.getByText("Ready", { exact: true })).toBeVisible();
  const snippet = await page.locator("pre code").innerText();
  expect(snippet).toContain("widget.js");
  expect(snippet).not.toContain(process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const publicId = snippet.match(/data-avenlyo-channel="([a-f0-9-]{36})"/)![1];
  await page.screenshot({
    path: "test-results/screenshots/channels-desktop.png",
    fullPage: true,
  });
  const visitorContext = await browser.newContext({
    viewport: { width: 1200, height: 850 },
  });
  const visitor = await visitorContext.newPage();
  await visitor.goto(`http://localhost:3001/chat-demo?channel=${publicId}`);
  await visitor.getByRole("button", { name: "Open business chat" }).click();
  await expect(
    visitor.getByRole("dialog", { name: "Business chat" }),
  ).toBeVisible();
  await visitor
    .getByLabel("Your message", { exact: true })
    .fill("I'm interested in your logo design.");
  await visitor.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    visitor
      .locator('[data-role="assistant"]')
      .filter({ hasText: "logo design" }),
  ).toBeVisible();
  await visitor
    .getByLabel("Your message", { exact: true })
    .fill("I'm Alex. My email is alex@example.test.");
  await visitor.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    visitor
      .locator('[data-role="customer"]')
      .filter({ hasText: "alex@example.test" }),
  ).toBeVisible();
  await visitor.screenshot({
    path: "test-results/screenshots/website-widget-desktop.png",
    fullPage: true,
  });
  expect(
    (await visitorContext.cookies()).filter((c) => c.name.startsWith("sb-"))
      .length,
  ).toBe(0);
  await page.goto("/app/inbox");
  await expect(
    page.getByRole("heading", { name: "Inbox", exact: true }),
  ).toBeVisible();
  await page.getByRole("link").filter({ hasText: "Alex" }).first().click();
  await expect(
    page.getByRole("link", { name: "View linked lead →" }),
  ).toBeVisible();
  await visitor
    .getByLabel("Your message", { exact: true })
    .fill("I want to speak with a person.");
  await visitor.getByRole("button", { name: "Send", exact: true }).click();
  await expect(visitor.getByRole("status")).toContainText(
    "Automated answers are paused",
  );
  await expect(
    page.locator(".thread-header").getByText("AI paused", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Claim conversation", exact: true })
    .click();
  await expect(
    page.getByText("Website Chat · Claimed by you", { exact: true }),
  ).toBeVisible();
  // The send is acknowledged, then the following thread read fails once.
  // This must not turn the confirmed reply into another send attempt.
  let replyPosts = 0;
  let acknowledged = false;
  let failRead = true;
  await page.route("**/api/inbox/*", async (route) => {
    const request = route.request();
    if (
      request.method() === "POST" &&
      request.postDataJSON()?.operation === "reply"
    ) {
      replyPosts += 1;
      const response = await route.fetch();
      if (response.ok()) acknowledged = true;
      await route.fulfill({ response });
    } else if (request.method() === "GET" && acknowledged && failRead) {
      failRead = false;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ code: "API_UNAVAILABLE" }),
      });
    } else await route.continue();
  });
  await page
    .getByLabel("Your human reply")
    .fill("Hi, this is Susan from Northstar Studio.");
  await page
    .getByRole("button", { name: "Send human reply", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "available to the website visitor" }),
  ).toBeVisible();
  await expect(page.getByLabel("Your human reply")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Retry same reply", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/Live updates are interrupted/)).toBeVisible();
  await expect(page.getByText(/Live updates are interrupted/)).toHaveCount(0, {
    timeout: 15000,
  });
  expect(replyPosts).toBe(1);
  expect(failRead).toBe(false);
  await expect(
    visitor
      .locator('[data-role="human"]')
      .filter({ hasText: "Hi, this is Susan from Northstar Studio." }),
  ).toBeVisible();
  await expect(
    page.getByText("Hi, this is Susan from Northstar Studio.", { exact: true }),
  ).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/screenshots/inbox-desktop.png",
    fullPage: true,
  });
  const assistantCount = await visitor
    .locator('[data-role="assistant"]')
    .count();
  await visitor
    .getByLabel("Your message", { exact: true })
    .fill("Can you tell me more?");
  await visitor.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    visitor
      .locator('[data-role="customer"]')
      .filter({ hasText: "Can you tell me more?" }),
  ).toBeVisible();
  expect(await visitor.locator('[data-role="assistant"]').count()).toBe(
    assistantCount,
  );
  await page
    .getByRole("button", { name: "Release conversation", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("AI remains paused");
  await page.getByRole("button", { name: "Resume AI", exact: true }).click();
  await expect(
    page.locator(".thread-header").getByText("AI active", { exact: true }),
  ).toBeVisible();
  await visitor
    .getByLabel("Your message", { exact: true })
    .fill("What logo design services do you offer?");
  await visitor.getByRole("button", { name: "Send", exact: true }).click();
  await expect(visitor.locator('[data-role="assistant"]')).toHaveCount(
    assistantCount + 1,
  );
  await visitor.setViewportSize({ width: 390, height: 844 });
  await visitor.screenshot({
    path: "test-results/screenshots/website-widget-mobile.png",
    fullPage: true,
  });
  const bounds = await visitor
    .getByRole("dialog", { name: "Business chat" })
    .boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
  const inboxUrl = page.url();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of [
    inboxUrl,
    "http://localhost:3001/app/inbox",
    "http://localhost:3001/app/channels",
  ]) {
    await page.goto(url);
    if (url === inboxUrl)
      await expect(
        page.getByRole("button", { name: "Claim conversation", exact: true }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("heading", {
          name: url.endsWith("/app/inbox")
            ? "Inbox"
            : "Meet customers where they are",
          exact: true,
        }),
      ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "test-results/screenshots/channels-mobile.png",
    fullPage: true,
  });
  await page.goto(inboxUrl);
  await expect(
    page.getByRole("button", { name: "Claim conversation", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".thread-header").getByText("AI active", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/screenshots/inbox-mobile.png",
    fullPage: true,
  });
  await visitor.goto(inboxUrl);
  await expect(visitor).toHaveURL(/\/auth\/sign-in$/);
  await visitorContext.close();
  await testInfo.attach("Customer Inbox", {
    path: "test-results/screenshots/inbox-desktop.png",
    contentType: "image/png",
  });
});
