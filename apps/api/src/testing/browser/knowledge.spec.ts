import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import {
  knowledgeTypes,
  knowledgeLabels,
  type Database,
} from "@avenlyo-app/shared";

test("Knowledge is a structured, responsive, published-only business workspace", async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:55321");
  const admin = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const email = `knowledge-${randomUUID()}@example.test`;
  const password = `Local-knowledge-${randomUUID()}!`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(created.error).toBeNull();
  const user = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  expect(
    (await user.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  const workspace = await user.rpc("create_workspace", {
    business_name: "Northstar Knowledge Studio",
  });
  expect(workspace.error).toBeNull();
  const shots = "test-results/screenshots/knowledge";
  await mkdir(shots, { recursive: true });
  const capture = async (name: string) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    const path = `${shots}/${name}.png`;
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(name, { path, contentType: "image/png" });
  };
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/knowledge");
  await expect(
    page.getByRole("heading", { name: "Teach Avenlyo about your business." }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Knowledge status filters" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Add knowledge", exact: true }),
  ).toHaveCount(1);
  await capture("desktop-1440-zero");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("mobile-390-zero");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByText("+ Create collection", { exact: true }).click();
  await page.getByLabel("Collection name", { exact: true }).fill("Services");
  await capture("desktop-1440-collection-create");
  await page
    .getByRole("button", { name: "Create collection", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Collection created");
  const collection = await user
    .from("knowledge_collections")
    .select("id")
    .eq("workspace_id", workspace.data!)
    .single();
  expect(collection.error).toBeNull();
  await page.goto("/app/knowledge/new");
  await expect(page.getByLabel("Service name", { exact: true })).toHaveCount(0);
  await capture("desktop-1440-type-picker");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("mobile-390-type-picker");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const titleLabels = {
    service: "Service name",
    pricing: "Pricing title",
    faq: "Question",
    policy: "Policy title",
    business_info: "Title / category",
    custom_note: "Title",
  };
  const contentLabels = {
    service: "Description",
    pricing: "Details / conditions (optional)",
    faq: "Answer",
    policy: "Policy details",
    business_info: "Information",
    custom_note: "Content",
  };
  for (const type of knowledgeTypes) {
    await page.goto("/app/knowledge/new");
    const radio = page.getByRole("radio", {
      name: knowledgeLabels[type],
      exact: true,
    });
    await radio.focus();
    await page.keyboard.press("Space");
    await page
      .getByLabel(titleLabels[type], { exact: true })
      .fill(
        type === "faq"
          ? "Do you work with small businesses?"
          : `${knowledgeLabels[type]} — Logo design`,
      );
    await page
      .getByLabel(contentLabels[type], { exact: true })
      .fill(
        "We provide logo design for small businesses. Two revisions are included.",
      );
    if (type === "service")
      await page
        .getByLabel("Details / limits (optional)", { exact: true })
        .fill("Delivery within five working days.");
    if (type === "pricing") {
      await page
        .getByLabel("Price / pricing statement", { exact: true })
        .fill("Starting at $50");
      await page.getByLabel("Currency (optional)", { exact: true }).fill("USD");
    }
    await page
      .getByLabel("Collection", { exact: true })
      .selectOption(collection.data!.id);
    await capture(`desktop-1440-add-${type}`);
    if (type === "pricing" || type === "faq") {
      await page.setViewportSize({ width: 390, height: 844 });
      await capture(`mobile-390-${type}-editor`);
      for (const width of [768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 1000 });
        await capture(`responsive-${width}-${type}-editor`);
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/knowledge\?notice=draft-saved/);
    const row = page
      .getByRole("article")
      .filter({
        has: page.getByRole("heading", {
          name:
            type === "faq"
              ? "Do you work with small businesses?"
              : `${knowledgeLabels[type]} — Logo design`,
          exact: true,
        }),
      });
    await expect(row.getByText("Draft", { exact: true })).toBeVisible();
    if (type === "service") await capture("desktop-1440-one-item");
    await row.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(row.getByRole("status")).toContainText("Published.");
    const persisted = await user
      .from("knowledge_items")
      .select("id,status,revision,runtime_content")
      .eq("workspace_id", workspace.data!)
      .eq("type", type)
      .single();
    expect(persisted.data?.status).toBe("published");
    if (type === "pricing") {
      expect(persisted.data?.runtime_content).toContain(
        "Price: Starting at $50\nCurrency: USD",
      );
      await row.getByRole("heading").getByRole("link").click();
      await page
        .getByLabel("Price / pricing statement", { exact: true })
        .fill("$50–$100");
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      await expect(
        page
          .getByRole("article")
          .filter({ hasText: "Pricing — Logo design" })
          .getByText("Draft", { exact: true }),
      ).toBeVisible();
    }
  }
  // More than twenty records validate density and long names without fixture-only UI paths.
  for (let i = 0; i < 18; i++)
    expect(
      (
        await user.rpc("save_business_knowledge", {
          target_workspace_id: workspace.data!,
          target_item_id: null,
          item_type: "custom_note",
          item_title: `Project knowledge ${String(i + 1).padStart(2, "0")}`,
          item_content: "Business facts for customers and project inquiries.",
          expected_revision: null,
          item_price_statement: "",
          item_currency: "",
          item_details: "",
          item_collection_id: null,
        })
      ).error,
    ).toBeNull();
  await page.goto("/app/knowledge");
  await expect(page.getByRole("article")).toHaveCount(24);
  await capture("desktop-1440-populated");
  for (const width of [1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await capture(
      width === 390 ? "mobile-390-populated" : `responsive-${width}-populated`,
    );
  }
  const firstRow = page.getByRole("article").first();
  await firstRow.getByText("More", {exact:true}).click();
  await firstRow.getByText("Delete", {exact:true}).click();
  await capture("mobile-390-actions");
  await firstRow.getByText("More", {exact:true}).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: /^Published/ }).click();
  await expect(page.getByRole("article")).toHaveCount(5);
  await capture("desktop-1440-published");
  await page
    .getByLabel("Search knowledge", { exact: true })
    .fill("No matching business facts");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No knowledge matches these filters." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Teach Avenlyo about your business." }),
  ).toHaveCount(0);
  await capture("desktop-1440-filter-empty");
  await page.getByRole("link", { name: "Clear filters", exact: true }).click();
  await page.getByLabel("Knowledge type filter").selectOption("pricing");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText("$50–$100");
  await page.getByRole("article").getByText("More", { exact: true }).click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(
    page.getByRole("article").getByText("Archived", { exact: true }),
  ).toBeVisible();
  await page.goto(`/app/knowledge?collection=${collection.data!.id}`);
  await page.getByText("Rename collection", { exact: true }).click();
  await page
    .getByLabel("Collection name", { exact: true })
    .last()
    .fill("Design services");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Collection renamed");
  await expect(
    page.getByRole("heading", { name: "Design services", exact: true }),
  ).toBeVisible();
});
