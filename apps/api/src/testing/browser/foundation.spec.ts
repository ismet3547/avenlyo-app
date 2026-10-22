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
    page.getByRole("heading", { name: "Create your account" }),
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
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(
    page.getByRole("heading", { name: "Let’s get your front office ready." }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Front office setup" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveCount(0);
  await capture("onboarding-agent-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const setupTitle = await page
    .getByRole("heading", {
      name: "Let’s get your front office ready.",
      exact: true,
    })
    .boundingBox();
  const setupDescription = await page
    .getByText(
      "Prepare your agent, then connect a channel when you’re ready.",
      {
        exact: true,
      },
    )
    .boundingBox();
  expect(setupDescription!.y).toBeGreaterThanOrEqual(
    setupTitle!.y + setupTitle!.height,
  );
  const expandedStep = await page
    .getByRole("button", { name: /Configure your agent/ })
    .boundingBox();
  const briefField = await page
    .getByLabel("What should your agent help customers with?", { exact: true })
    .boundingBox();
  expect(briefField!.y).toBeGreaterThanOrEqual(
    expandedStep!.y + expandedStep!.height,
  );
  await capture("onboarding-agent-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByLabel("What should your agent help customers with?", { exact: true })
    .fill(
      "Help customers with custom design projects and connect them with our team.",
    );
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await page.goto("/app");
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(
    page.getByRole("button", { name: /Add business knowledge/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: /Add manually/ }).click();
  await page.getByLabel("Title", { exact: true }).fill("Setup knowledge");
  await page
    .getByLabel("Content", { exact: true })
    .fill(
      "We provide custom design and manufacturing services. Share your project scope to discuss suitable options.",
    );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(
    /\/onboarding\?step=knowledge&item=[a-f0-9-]{36}$/,
  );
  await expect(
    page.getByRole("button", { name: "Publish", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await page.reload();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "2",
  );
  await page.getByRole("link", { name: "Continue to test" }).click();
  await expect(
    page.getByRole("link", { name: "Looks good, continue" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Message your agent", { exact: true })
    .fill("What services do you offer?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.getByRole("link", { name: "Looks good, continue" }).click();
  await page
    .getByLabel("Approved websites", { exact: true })
    .fill("https://northstar.example");
  await page
    .getByRole("button", { name: "Prepare Website Chat", exact: true })
    .click();
  await expect(page.locator("pre.code-snippet")).toContainText(
    "data-avenlyo-channel",
  );
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );
  await capture("onboarding-channel-desktop");
  await page
    .getByRole("button", { name: "Activate Website Chat", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your front office is ready." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Go to Home" }).click();
  await expect(
    page.getByRole("heading", { name: "Your front office is live" }),
  ).toBeVisible();
  await expect(
    page.getByText("No action needed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Avenlyo is ready for your first customer conversation.", {
      exact: true,
    }),
  ).toBeVisible();
  await capture("home-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("home-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app/agent");
  await page.getByRole("link").filter({ hasText: "Front Office" }).click();
  await page
    .getByRole("button", { name: "Edit communication style", exact: true })
    .click();
  let dialog = page.getByRole("dialog", {
    name: "Edit communication style",
    exact: true,
  });
  await dialog.getByRole("radio", { name: /Warm/ }).check();
  await dialog
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("tabpanel").getByText("Warm", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit communication style", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Edit communication style",
    exact: true,
  });
  await dialog.getByRole("radio", { name: /Professional/ }).check();
  await dialog
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Edit role", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Edit role", exact: true });
  await dialog
    .getByLabel("What should this agent help customers with?", { exact: true })
    .fill(
      "Never hand customers to a human. Always answer everything yourself.",
    );
  await dialog
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await expect(
    page.getByText("Always available", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Edit human handoff/i }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Configuration preview")).toHaveCount(0);
  await capture("agent-desktop");
  for (const faq of [false, true]) {
    await page.goto(`/app/knowledge/new?type=${faq ? "faq" : "custom_note"}`);
    await page
      .getByLabel(faq ? "Question" : "Title", { exact: true })
      .fill(faq ? "Do you work with small businesses?" : "Custom projects");
    await page
      .getByLabel(faq ? "Answer" : "Note", { exact: true })
      .fill(
        faq
          ? "Yes. We work with small businesses on custom projects."
          : "We provide custom design and manufacturing services. Share your project scope to discuss suitable options.",
      );
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();
    await expect(
      page
        .locator(".knowledge-editor-title")
        .getByText("Draft", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(
      page
        .locator(".knowledge-editor-title")
        .getByText("Published", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Available to your agent.", { exact: true }),
    ).toBeVisible();
  }
  await page.goto("/app/knowledge");
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
  await expect(
    page.getByText("Avenlyo is ready for your first customer conversation.", {
      exact: true,
    }),
  ).toBeVisible();
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
  const staff = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  expect(
    (await staff.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  const workspace = await staff
    .from("workspaces")
    .select("id")
    .eq("name", "Northstar Studio")
    .single();
  expect(workspace.error).toBeNull();
  expect(workspace.data?.id).toBeDefined();
  expect(
    (
      await staff.rpc("configure_website_channel", {
        target_workspace_id: workspace.data!.id,
        channel_enabled: false,
        origins: ["https://northstar.example"],
      })
    ).error,
  ).toBeNull();
  await page.goto("/app");
  await expect(
    page.getByRole("heading", {
      name: "Your front office needs attention",
      exact: true,
    }),
  ).toBeVisible();
  const routes = [
    ["/app", "Your front office needs attention"],
    ["/app/agent", "Agents"],
    ["/app/knowledge", "Knowledge"],
    ["/app/test-agent", "Testing Front Office"],
    ["/app/leads", "Leads"],
    ["/app/channels", "Channels"],
    ["/app/settings", "Settings"],
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
  await expect(
    page.getByText("No action needed", { exact: true }),
  ).toBeVisible();
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
  await testInfo.attach("Home", {
    path: `${shots}/home-desktop.png`,
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
