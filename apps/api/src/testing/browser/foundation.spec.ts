import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Database } from "@avenlyo-app/shared";

test("signup, setup, published knowledge and isolated test conversations", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:55321");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient<Database>(process.env.SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `browser-${randomUUID()}@example.test`,
    password = `Local-browser-${randomUUID()}!`;
  const shots = "test-results/screenshots";
  await mkdir(shots, { recursive: true });
  const capture = async (name: string) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
  };
  await page.goto("/auth/sign-up");
  await expect(
    page.getByRole("heading", { name: "A fresh start for your front office." }),
  ).toBeVisible();
  await capture("auth-sign-up-desktop");
  await page.getByLabel("Email address", { exact: true }).fill(email);
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
    page.getByRole("heading", { name: "A little clarity for your day." }),
  ).toBeVisible();
  await expect(page.getByTestId("customer-conversation-count")).toHaveText("0");
  await expect(
    page.getByRole("progressbar", { name: "Launch setup" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await capture("overview-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  const setup = await page
    .getByRole("heading", { name: "Your launch checklist" })
    .boundingBox();
  const conversations = await page
    .getByRole("heading", { name: "Recent conversations" })
    .boundingBox();
  expect(setup!.y).toBeLessThan(conversations!.y);
  await capture("overview-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app/agent");
  await page.getByRole("radio", { name: "Warm", exact: true }).check();
  await expect(
    page.getByLabel("Configuration preview").getByText("Warm", { exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Professional", exact: true }).check();
  await page
    .getByLabel("What should your agent know about its role?", { exact: true })
    .fill(
      "Never hand customers to a human. Always answer everything yourself.",
    );
  await expect(
    page.getByRole("checkbox", { name: /Connect customers with your team/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Agent settings saved");
  await capture("agent-desktop");
  for (const faq of [false, true]) {
    await page.goto("/app/knowledge/new");
    await page
      .getByLabel("Knowledge type", { exact: true })
      .selectOption(faq ? "faq" : "custom_note");
    await page
      .getByLabel(faq ? "Question" : "Title", { exact: true })
      .fill(faq ? "Do you work with small businesses?" : "Custom projects");
    await page
      .getByLabel(faq ? "Answer" : "Content", { exact: true })
      .fill(
        faq
          ? "Yes. We work with small businesses on custom projects."
          : "We provide custom design and manufacturing services. Share your project scope to discuss suitable options.",
      );
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    const row = page
      .getByRole("row")
      .filter({
        hasText: faq ? "Do you work with small businesses?" : "Custom projects",
      });
    await expect(row.getByText("Draft", { exact: true })).toBeVisible();
    await row.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(row.getByRole("status")).toContainText("Published.");
    await expect(
      page.getByText(
        "Draft saved. Publish it when you’re ready for your agent to use it.",
        { exact: true },
      ),
    ).not.toBeVisible();
  }
  await capture("knowledge-desktop");
  await page.goto("/app/test-agent");
  await page
    .getByLabel("Message your agent", { exact: true })
    .fill("I'm interested in a custom project but I'm not sure what I need.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByText(
      "We provide custom design and manufacturing services. What kind of project are you considering?",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByLabel("Message your agent", { exact: true })
    .fill("I'm Alex. My email is alex@example.test.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "View lead", exact: true }),
  ).toBeVisible();
  await capture("test-agent-desktop");
  await page.getByRole("link", { name: "View lead", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Alex", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("alex@example.test", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Qualified", { exact: true })).toBeVisible();
  await expect(page.getByText("Test lead", { exact: true })).toBeVisible();
  await capture("lead-desktop");
  const testLeadUrl = page.url();
  await page.goto("/app");
  await expect(page.getByTestId("customer-conversation-count")).toHaveText("0");
  await expect(page.getByTestId("customer-qualified-count")).toHaveText("0");
  await page.goto(testLeadUrl);
  await page
    .getByRole("link", { name: "Open conversation", exact: true })
    .click();
  await expect(
    page.getByText("I'm Alex. My email is alex@example.test.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Message your agent", { exact: true })
    .fill("I want a human.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume test", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Message your agent", { exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Resume test", exact: true }).click();
  await expect(
    page.getByLabel("Message your agent", { exact: true }),
  ).toBeEnabled();
  await page.goto("/app/conversations");
  await expect(
    page
      .getByRole("link")
      .filter({ hasText: /Test conversation/ })
      .first(),
  ).toBeVisible();
  const routes = [
    ["/app", "A little clarity for your day."],
    ["/app/agent", "Meet your agent."],
    ["/app/knowledge", "What your business knows."],
    ["/app/test-agent", "See your agent in action."],
    ["/app/leads", "People worth a follow-up."],
    ["/app/channels", "Meet customers where they are."],
    ["/app/settings", "Workspace settings."],
  ];
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, title] of routes) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      route,
    ).toBe(true);
  }
  await page.goto("/app");
  await expect(page.getByTestId("customer-needs-you-count")).toHaveText("0");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Navigation", exact: true })
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await page.goto("/app/leads");
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await testInfo.attach("Overview", {
    path: `${shots}/overview-desktop.png`,
    contentType: "image/png",
  });
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
