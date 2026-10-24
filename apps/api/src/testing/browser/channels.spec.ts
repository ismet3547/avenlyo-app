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
  async function capturePage(options: Parameters<typeof page.screenshot>[0]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot(options);
  }
  await mkdir("test-results/screenshots", { recursive: true });
  await page.goto("/auth/sign-in");
  await expect(
    page.getByRole("heading", { name: "Sign in to Avenlyo", exact: true }),
  ).toBeVisible();
  await capturePage({
    path: "test-results/screenshots/auth-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Email address", { exact: true }).fill(email);
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
    page.getByRole("heading", {
      name: "Let’s get your front office ready.",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/app/agent");
  await page.getByRole("link").filter({ hasText: "Front Office" }).click();
  await page.getByRole("button", { name: "Edit role", exact: true }).click();
  await page
    .getByLabel("What should this agent help customers with?", {
      exact: true,
    })
    .fill(
      "Help small businesses understand our design services, identify useful inquiries and connect them with our team.",
    );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await page.goto("/app/knowledge/new?type=custom_note");
  await page.getByLabel("Title", { exact: true }).fill("Logo design");
  await page
    .getByLabel("Note", { exact: true })
    .fill(
      "We provide logo design for small businesses. Share your design project scope to discuss suitable options.",
    );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page
      .locator(".knowledge-editor-title")
      .getByText("Published", { exact: true }),
  ).toBeVisible();
  await page.goto("/app/test-agent");
  await page
    .getByLabel("Message your agent", { exact: true })
    .fill("What services do you offer?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".thread-messages .message")).toHaveCount(2);
  await page.goto("/app/channels");
  await expect(page.getByText("Not connected", { exact: true })).toHaveCount(2);
  await page
    .getByLabel("Approved websites", { exact: true })
    .fill("http://localhost:3001");
  await page.getByRole("checkbox", { name: "Enable Website Chat" }).check();
  await page.getByRole("button", { name: "Save channel", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ready");
  await expect(page.getByText("Ready", { exact: true })).toBeVisible();
  await page.getByText("Install on your website", { exact: true }).click();
  const snippet = await page.locator("pre.code-snippet").innerText();
  expect(snippet).toContain("widget.js");
  expect(snippet).not.toContain(process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const publicId = snippet.match(/data-avenlyo-channel="([a-f0-9-]{36})"/)![1];
  await capturePage({
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
    .getByRole("button", { name: "Close chat", exact: true })
    .click();
  await expect(
    visitor.getByRole("dialog", { name: "Business chat" }),
  ).not.toBeVisible();
  await expect(
    visitor.getByRole("button", { name: "Open business chat" }),
  ).toBeFocused();
  await visitor.screenshot({
    path: "test-results/screenshots/website-widget-launcher-desktop.png",
    fullPage: true,
  });
  await visitor.setViewportSize({ width: 390, height: 844 });
  await visitor.screenshot({
    path: "test-results/screenshots/website-widget-launcher-mobile.png",
    fullPage: true,
  });
  await visitor.setViewportSize({ width: 1200, height: 850 });
  await visitor.getByRole("button", { name: "Open business chat" }).click();
  await expect(
    visitor.getByRole("dialog", { name: "Business chat" }),
  ).toBeVisible();
  await expect(
    visitor.getByRole("heading", { name: "Northstar Studio", exact: true }),
  ).toBeVisible();
  await expect(
    visitor.getByLabel("Your message", { exact: true }),
  ).toBeEnabled();
  await visitor.screenshot({
    path: "test-results/screenshots/website-widget-welcome-desktop.png",
    fullPage: true,
  });
  await visitor.setViewportSize({ width: 390, height: 844 });
  await visitor.screenshot({
    path: "test-results/screenshots/website-widget-welcome-mobile.png",
    fullPage: true,
  });
  await visitor.setViewportSize({ width: 1200, height: 850 });
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
  await capturePage({
    path: "test-results/screenshots/inbox-list-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link").filter({ hasText: "Alex" }).first().click();
  await expect(page.getByRole("link", { name: "View lead" })).toBeVisible();
  await expect(
    page
      .getByLabel("Conversation thread", { exact: true })
      .getByText("AI handling", { exact: true }),
  ).toBeVisible();
  await capturePage({
    path: "test-results/screenshots/inbox-active-desktop.png",
    fullPage: true,
  });
  await visitor
    .getByLabel("Your message", { exact: true })
    .fill("I want to speak with a person.");
  await visitor.getByRole("button", { name: "Send", exact: true }).click();
  await expect(visitor.getByRole("status")).toContainText(
    "Automated answers are paused",
  );
  await page.bringToFront();
  await expect(page.getByText("AI paused", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await page
    .getByRole("button", { name: "Claim conversation", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Conversation assigned to you." }),
  ).toBeVisible();
  const conversationList = page.getByRole("navigation", {
    name: "Conversations",
    exact: true,
  });
  await expect(
    conversationList.getByText("Assigned to you", { exact: true }),
  ).toBeVisible();
  await expect(
    conversationList.getByText("Needs your help", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Reply to customer")
    .fill("Hi, this is Susan from Northstar Studio.");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your reply was saved");
  await expect(
    visitor
      .locator('[data-role="human"]')
      .filter({ hasText: "Hi, this is Susan from Northstar Studio." }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Conversation thread", { exact: true })
      .getByText("Hi, this is Susan from Northstar Studio.", { exact: true }),
  ).toBeInViewport();
  await visitor.screenshot({
    path: "test-results/screenshots/website-widget-handoff-desktop.png",
    fullPage: true,
  });
  await visitor.setViewportSize({ width: 390, height: 844 });
  await visitor.screenshot({
    path: "test-results/screenshots/website-widget-handoff-mobile.png",
    fullPage: true,
  });
  await visitor.setViewportSize({ width: 1200, height: 850 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await capturePage({
    path: "test-results/screenshots/inbox-desktop.png",
    fullPage: true,
  });
  const pausedInboxUrl = page.url();
  await page.setViewportSize({ width: 390, height: 844 });
  await capturePage({
    path: "test-results/screenshots/inbox-paused-mobile.png",
    fullPage: true,
  });
  expect(
    await page
      .getByLabel("Conversation thread", { exact: true })
      .evaluate((node) => getComputedStyle(node).overflowY),
  ).toBe("visible");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app");
  await expect(
    page.getByRole("heading", {
      name: "Your front office is live",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Needs your attention", exact: true })
      .getByRole("link")
      .filter({ hasText: "Alex" }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("link").filter({ hasText: "Alex" }).first(),
  ).toBeVisible();
  await capturePage({
    path: "test-results/screenshots/home-needs-attention-desktop.png",
    fullPage: true,
  });
  await page.goto(pausedInboxUrl);
  await expect(
    page.getByRole("button", { name: "Release", exact: true }),
  ).toBeVisible();
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
  await page.getByRole("button", { name: "Release", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("AI remains paused");
  await page.getByRole("button", { name: "Resume AI", exact: true }).click();
  await expect(
    page
      .getByLabel("Conversation thread", { exact: true })
      .getByText("AI handling", { exact: true }),
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
  const leadUrl = await page
    .getByRole("link", { name: "View lead", exact: true })
    .getAttribute("href");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of [
    inboxUrl,
    "http://localhost:3001/app/inbox",
    "http://localhost:3001/app/channels",
  ]) {
    await page.goto(url);
    if (url === inboxUrl)
      await expect(page.getByLabel("Reply to customer")).toBeVisible();
    else
      await expect(
        page.getByRole("heading", {
          name: url.endsWith("/app/inbox") ? "Inbox" : "Channels",
          exact: true,
        }),
      ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
  await capturePage({
    path: "test-results/screenshots/channels-mobile.png",
    fullPage: true,
  });
  await page.goto(inboxUrl);
  await expect(page.getByLabel("Reply to customer")).toBeVisible();
  await expect(
    page
      .getByLabel("Conversation thread", { exact: true })
      .getByText("AI handling", { exact: true }),
  ).toBeVisible();
  await capturePage({
    path: "test-results/screenshots/inbox-mobile.png",
    fullPage: true,
  });
  // Mobile ownership is reachable from the composer, with unchanged pause/resume semantics.
  await page
    .getByRole("button", { name: "Claim conversation", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Conversation assigned to you." }),
  ).toBeVisible();
  await expect(page.getByLabel("Reply to customer")).toBeEnabled();
  await page.getByRole("button", { name: "Release", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("AI remains paused");
  await page.getByRole("button", { name: "Resume AI", exact: true }).click();
  await expect(
    page
      .getByLabel("Conversation thread", { exact: true })
      .getByText("AI handling", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  const drawer = page.getByRole("dialog", {
    name: "Navigation",
    exact: true,
  });
  await expect(drawer).toBeVisible();
  // The stripped shell retains every real product destination on mobile.
  for (const [label, href] of [
    ["Home", "/app"],
    ["Inbox", "/app/inbox"],
    ["Leads", "/app/leads"],
    ["Agent", "/app/agent"],
    ["Knowledge", "/app/knowledge"],
    ["Channels", "/app/channels"],
    ["Test agent", "/app/test-agent"],
    ["Test history", "/app/conversations"],
    ["Settings", "/app/settings"],
  ]) {
    await expect(
      drawer
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("href", href);
  }
  await expect(
    drawer.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeEnabled();
  await expect(
    drawer.getByRole("link", {
      name: "Choose or create workspace",
      exact: true,
    }),
  ).toHaveAttribute("href", "/workspaces");
  await capturePage({
    path: "test-results/screenshots/mobile-navigation-390.png",
    fullPage: false,
  });
  await page.keyboard.press("Tab");
  expect(
    await drawer.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await drawer.getByRole("link", { name: "Agent", exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Agents", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: "Conversations", exact: true }),
  ).toHaveCount(0);
  await page.goto("/app/conversations");
  await expect(
    page.getByRole("heading", {
      name: "Test history",
      exact: true,
    }),
  ).toBeVisible();
  const routes = [
    ["/app", "Your front office is live", "home-active"],
    ["/app/inbox", "Inbox", "inbox-list"],
    [inboxUrl, "Alex", "inbox-conversation"],
    ["/app/agent", "Agents", "agent"],
    ["/app/knowledge", "Knowledge", "knowledge"],
    ["/app/channels", "Channels", "channels"],
    ["/app/leads", "Leads", "leads"],
    [leadUrl!, "Alex", "lead"],
    ["/app/conversations", "Test history", "conversations"],
    ["/app/test-agent", "Testing Front Office", "test-agent"],
    ["/app/settings", "Settings", "settings"],
  ];
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [route, heading, name] of routes) {
      await page.goto(route);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      if (route === inboxUrl) {
        await expect(page.getByLabel("Reply to customer")).toBeVisible();
        if (width === 1440) {
          const list = await page
            .getByRole("navigation", {
              name: "Conversations",
              exact: true,
            })
            .boundingBox();
          const center = await page
            .getByLabel("Conversation thread", { exact: true })
            .boundingBox();
          expect(list).not.toBeNull();
          expect(center).not.toBeNull();
          expect(list!.x + list!.width).toBeLessThanOrEqual(center!.x + 1);
          await expect(
            page.getByRole("heading", {
              name: "Customer details",
              exact: true,
            }),
          ).toBeVisible();
        }
        if (width === 390)
          expect(
            await page
              .getByLabel("Conversation thread", { exact: true })
              .evaluate((node) => getComputedStyle(node).overflowY),
          ).toBe("visible");
      }
      if (name === "knowledge") {
        const main = await page.locator("#main-content").boundingBox();
        const heading = await page
          .getByRole("heading", { name: "Knowledge", exact: true })
          .boundingBox();
        expect(heading!.y - main!.y).toBeGreaterThanOrEqual(
          width <= 700 ? 16 : 24,
        );
        expect(heading!.y - main!.y).toBeLessThanOrEqual(
          width <= 700 ? 18 : 26,
        );
        const inset = await page.locator("#main-content").evaluate((node) => ({
          horizontal: parseFloat(getComputedStyle(node).paddingLeft),
          bottom: parseFloat(getComputedStyle(node).paddingBottom),
        }));
        expect(inset.horizontal).toBe(width <= 700 ? 16 : 24);
        expect(inset.bottom).toBe(width <= 700 ? 16 : 24);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `No overflow at ${width}px: ${name}`,
      ).toBe(true);
      if ([1440, 1024, 768, 390].includes(width))
        await capturePage({
          path: `test-results/screenshots/product-${name}-${width}.png`,
          fullPage: true,
        });
    }
  }
  await visitor.goto(inboxUrl);
  await expect(visitor).toHaveURL(/\/auth\/sign-in$/);
  await visitorContext.close();
  await testInfo.attach("Customer Inbox", {
    path: "test-results/screenshots/inbox-desktop.png",
    contentType: "image/png",
  });
});
