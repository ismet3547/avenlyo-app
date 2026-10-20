import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import {
  knowledgeTypes,
  knowledgeLabels,
  type Database,
} from "@avenlyo-app/shared";

test("all knowledge types, publication, filters, collections and safe deletion", async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:55321");
  const admin = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const email = `knowledge-${randomUUID()}@example.test`,
    password = `Local-knowledge-${randomUUID()}!`;
  expect(
    (
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
    ).error,
  ).toBeNull();
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const path = `${shots}/${name}.png`;
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(name, { path, contentType: "image/png" });
  };
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.goto("/app/knowledge");
  await expect(
    page.getByRole("heading", {
      name: "A home for everything your business knows",
    }),
  ).toBeVisible();
  await capture("empty-desktop");
  await page.getByText("Organize with collections", { exact: true }).click();
  await page.getByLabel("Collection name", { exact: true }).fill("Services");
  await page
    .getByRole("button", { name: "Create collection", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Collection created" }),
  ).toContainText("Collection created");
  const collection = await user
    .from("knowledge_collections")
    .select("id")
    .eq("workspace_id", workspace.data!)
    .single();
  expect(collection.error).toBeNull();
  for (const type of knowledgeTypes) {
    await page.goto("/app/knowledge/new");
    await page.getByLabel("Knowledge type", { exact: true }).selectOption(type);
    const title = `${knowledgeLabels[type]} — Logo design`;
    await page
      .getByLabel(type === "faq" ? "Question" : "Title", { exact: true })
      .fill(title);
    await page
      .getByLabel(
        type === "faq"
          ? "Answer"
          : type === "pricing"
            ? "Additional context"
            : "Content",
        { exact: true },
      )
      .fill(
        "We provide logo design for small businesses. Two revisions are included.",
      );
    if (type === "service")
      await page
        .getByLabel("Details and limits", { exact: true })
        .fill("Delivery within five working days.");
    if (type === "pricing") {
      await page
        .getByLabel("Price or pricing statement", { exact: true })
        .fill("Starting at $50");
      await page.getByLabel("Currency", { exact: true }).fill("USD");
    }
    await page
      .getByLabel("Collection", { exact: true })
      .selectOption(collection.data!.id);
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await capture(`editor-${type}-${width}`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page).toHaveURL(/notice=draft-saved/);
    const row = page
      .getByRole("row")
      .filter({ has: page.getByRole("link", { name: title, exact: true }) });
    await expect(row.getByText("Draft", { exact: true })).toBeVisible();
    await row.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(row.getByRole("status")).toContainText("Published.");
    const persisted = await user
      .from("knowledge_items")
      .select("status,runtime_content")
      .eq("workspace_id", workspace.data!)
      .eq("type", type)
      .single();
    expect(persisted.data?.status).toBe("published");
    if (type === "pricing") {
      expect(persisted.data?.runtime_content).toContain(
        "Price: Starting at $50\nCurrency: USD",
      );
      await row.getByRole("link", { name: title, exact: true }).click();
      await page
        .getByLabel("Price or pricing statement", { exact: true })
        .fill("$50–$100");
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      await expect(row.getByText("Draft", { exact: true })).toBeVisible();
    }
  }
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
  await expect(page.getByRole("row")).toHaveCount(25);
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await capture(`library-${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /^Published/ }).click();
  await expect(page.getByRole("row")).toHaveCount(6);
  await page
    .getByLabel("Search knowledge", { exact: true })
    .fill("No matching business facts");
  await expect(
    page.getByRole("heading", { name: "No matching knowledge" }),
  ).toBeVisible();
  await page.getByLabel("Search knowledge", { exact: true }).fill("");
  await page.getByRole("button", { name: /^All knowledge/ }).click();
  await page.getByLabel("Knowledge type filter").selectOption("pricing");
  await expect(page.getByRole("row")).toHaveCount(2);
  await expect(page.getByRole("row").last()).toContainText("$50–$100");
  await page.getByRole("row").last().getByText("More", { exact: true }).click();
  await page.getByRole("button", { name: "Archive item", exact: true }).click();
  await page.getByRole("button", { name: /^Archived/ }).click();
  await expect(
    page.getByRole("row").last().getByText("Archived", { exact: true }),
  ).toBeVisible();
  await page.goto(`/app/knowledge?collection=${collection.data!.id}`);
  await expect(page.getByRole("row")).toHaveCount(6);
  await page.getByText("Organize with collections", { exact: true }).click();
  await page.getByText("Rename Services", { exact: true }).click();
  await page
    .getByLabel("Collection name", { exact: true })
    .last()
    .fill("Design services");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Collection renamed" }),
  ).toContainText("Collection renamed");
  expect(
    (
      await user
        .from("knowledge_collections")
        .select("name")
        .eq("id", collection.data!.id)
        .single()
    ).data?.name,
  ).toBe("Design services");
  await page.goto("/app/knowledge");
  const firstRow = page.getByRole("row").nth(1);
  const title = await firstRow.getByRole("link").first().innerText();
  await firstRow.getByText("More", { exact: true }).click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await firstRow
    .getByRole("button", { name: "Delete item", exact: true })
    .click();
  await expect(firstRow).toContainText(title);
  page.once("dialog", (dialog) => dialog.accept());
  await firstRow
    .getByRole("button", { name: "Delete item", exact: true })
    .click();
  await expect(
    page
      .getByRole("row")
      .filter({ has: page.getByRole("link", { name: title, exact: true }) }),
  ).toHaveCount(0);
});
