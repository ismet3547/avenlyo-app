import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import {
  knowledgeTypes,
  knowledgeLabels,
  type Database,
  type KnowledgeType,
} from "@avenlyo-app/shared";

test("Knowledge library, six editors, explicit lifecycle, imports and tenant isolation", async ({
  page,
}, testInfo) => {
  test.setTimeout(300000);
  expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:55321");
  const client = (key: string) =>
    createClient<Database>(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  const admin = client(process.env.SUPABASE_SERVICE_ROLE_KEY!);
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
  const user = client(process.env.SUPABASE_PUBLISHABLE_KEY!);
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
  const rows = page.locator(".knowledge-list > li");
  const editorStatus = (status: string) =>
    page.locator(".knowledge-editor-title").getByText(status, { exact: true });
  const savedItem = async () => {
    const id = new URL(page.url()).pathname.split("/").at(-1)!;
    const result = await user
      .from("knowledge_items")
      .select("*")
      .eq("workspace_id", workspace.data!)
      .eq("id", id)
      .single();
    expect(result.error).toBeNull();
    return result.data!;
  };
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.goto("/app/knowledge");
  await expect(
    page.getByRole("heading", { name: "Knowledge", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Give Avenlyo the information it needs/),
  ).toBeVisible();
  for (const name of ["Add manually", "Import webpage", "Upload file"])
    await expect(
      page.getByRole("link", { name: new RegExp(name) }),
    ).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Filter", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("group", { name: "Knowledge status" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Manage collections", { exact: true }),
  ).toHaveCount(0);
  await capture("empty-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("empty-mobile");
  await page
    .getByRole("button", { name: "Add knowledge", exact: true })
    .click();
  const addDialog = page.getByRole("dialog", {
    name: "Add knowledge",
    exact: true,
  });
  await expect(addDialog).toBeVisible();
  for (const name of ["Add manually", "Import webpage", "Upload file"])
    await expect(
      addDialog.getByRole("link", { name: new RegExp(name) }),
    ).toBeVisible();
  await capture("add-sheet-mobile");
  await page.keyboard.press("Escape");
  await expect(addDialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add knowledge", exact: true }),
  ).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Collections remain available in their dedicated maintenance area, even before first use.
  await page.goto("/app/knowledge/collections");
  await page
    .getByRole("button", { name: "Create collection", exact: true })
    .click();
  await page.getByLabel("Collection name", { exact: true }).fill("Services");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create collection", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Services", exact: true }),
  ).toBeVisible();
  const collection = await user
    .from("knowledge_collections")
    .select("id")
    .eq("workspace_id", workspace.data!)
    .single();
  expect(collection.error).toBeNull();
  const labels: Record<KnowledgeType, [string, string]> = {
    service: ["Service name", "Description"],
    pricing: ["Pricing title", "Details"],
    faq: ["Question", "Answer"],
    policy: ["Policy name", "Policy"],
    business_info: ["Topic", "Information"],
    custom_note: ["Title", "Note"],
  };
  const itemIds = new Map<KnowledgeType, string>();
  for (const type of knowledgeTypes) {
    await page.goto("/app/knowledge/new");
    await expect(
      page.getByRole("heading", {
        name: "What kind of information are you adding?",
      }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: new RegExp(`^${knowledgeLabels[type]}`) })
      .click();
    const title = `${knowledgeLabels[type]} — Logo design`;
    await page.getByLabel(labels[type][0], { exact: true }).fill(title);
    await page
      .getByLabel(labels[type][1], { exact: true })
      .fill(
        "We provide logo design for small businesses. Two revisions are included.",
      );
    if (type === "service") {
      await page
        .getByRole("textbox", { name: "Additional details", exact: true })
        .fill("Delivery within five working days.");
      await page
        .getByRole("textbox", { name: "Pricing note", exact: true })
        .fill("Projects are quoted individually.");
    }
    if (type === "pricing") {
      await page
        .getByLabel("Price statement", { exact: true })
        .fill("Starting at $50");
      await page.getByText("Currency (optional)", { exact: true }).click();
      await page.getByLabel("Currency", { exact: true }).fill("USD");
    }
    await page
      .getByRole("combobox", { name: "Collection", exact: true })
      .selectOption(collection.data!.id);
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await capture(`editor-${type}-${width}`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page).toHaveURL(
      /\/app\/knowledge\/[a-f0-9-]{36}\?notice=saved$/,
    );
    await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();
    await expect(editorStatus("Draft")).toBeVisible();
    let persisted = await savedItem();
    itemIds.set(type, persisted.id);
    expect(persisted.status).toBe("draft");
    expect(persisted.embedding).toBeNull();
    expect(persisted.type).toBe(type);
    if (type === "service") {
      expect(persisted.runtime_content).toContain(
        "Delivery within five working days.",
      );
      expect(persisted.runtime_content).toContain(
        "Projects are quoted individually.",
      );
    }
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(editorStatus("Published")).toBeVisible();
    await expect(
      page.getByText("Available to your agent.", { exact: true }),
    ).toBeVisible();
    persisted = await savedItem();
    expect(persisted.status).toBe("published");
    expect(persisted.embedding).not.toBeNull();
    if (type === "pricing") {
      expect(persisted.runtime_content).toContain(
        "Price: Starting at $50\nCurrency: USD",
      );
      await page
        .getByLabel("Price statement", { exact: true })
        .fill("$50–$100");
      await expect(
        page.getByText(
          "Saving changes returns this item to Draft. Publish it again after review.",
        ),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await expect(editorStatus("Draft")).toBeVisible();
      await expect(
        page.getByLabel("Price statement", { exact: true }),
      ).toHaveValue("$50–$100");
      persisted = await savedItem();
      expect(persisted.status).toBe("draft");
      expect(persisted.embedding).toBeNull();
    }
    if (type === "service") {
      await page.goto("/app/knowledge");
      await expect(rows).toHaveCount(1);
      await capture("one-item-library");
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
  await expect(rows).toHaveCount(24);
  await expect(page.getByRole("link", { name: /Import webpage/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Restore", exact: true }),
  ).toHaveCount(0);
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await capture(`library-${width}`);
  }
  await page
    .getByRole("button", { name: "Add knowledge", exact: true })
    .click();
  await expect(addDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Published", exact: true }).click();
  await expect(rows).toHaveCount(5);
  await page.getByRole("button", { name: /^Drafts/ }).click();
  await expect(rows).toHaveCount(19);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search knowledge", exact: true })
    .fill("No matching business facts");
  await expect(
    page.getByRole("heading", { name: "No results", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Give Avenlyo the information it needs/),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(rows).toHaveCount(24);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("Status", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("radio", { name: "Pricing", exact: true }).check();
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("Pricing — Logo design");
  await page
    .getByRole("searchbox", { name: "Search knowledge", exact: true })
    .fill("$50–$100");
  await expect(rows).toHaveCount(1);
  await page.getByRole("button", { name: "Filter · 1", exact: true }).click();
  await page.getByRole("radio", { name: "All", exact: true }).check();
  await page
    .getByRole("combobox", { name: "Collection", exact: true })
    .selectOption(collection.data!.id);
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search knowledge", exact: true })
    .fill("");
  await expect(rows).toHaveCount(6);

  // Unsaved navigation is guarded only after a real edit; Keep editing retains all text.
  await page.goto(`/app/knowledge/${itemIds.get("pricing")}`);
  await page
    .getByLabel("Details", { exact: true })
    .fill("Unsaved customer conditions.");
  await page.locator(".knowledge-back").click();
  await expect(
    page.getByRole("dialog", { name: "You have unsaved changes." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(page.getByLabel("Details", { exact: true })).toHaveValue(
    "Unsaved customer conditions.",
  );
  await page.locator(".knowledge-back").click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/knowledge$/);
  await page.goto(`/app/knowledge/${itemIds.get("pricing")}`);
  await expect(page.getByLabel("Details", { exact: true })).not.toHaveValue(
    "Unsaved customer conditions.",
  );
  await page.getByLabel("Type", { exact: true }).selectOption("custom_note");
  await expect(
    page.getByRole("dialog", { name: "Change knowledge type?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Change type", exact: true }).click();
  await expect(page.getByLabel("Note", { exact: true })).toHaveValue(
    /\$50–\$100/,
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();
  expect((await savedItem()).content).toContain("Currency: USD");

  // Lifecycle actions preserve their existing server security and explicit confirmation.
  await page.goto(`/app/knowledge/${itemIds.get("faq")}`);
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editorStatus("Published")).toBeVisible();
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Unpublish", exact: true })
    .click();
  await expect(editorStatus("Draft")).toBeVisible();
  expect((await savedItem()).embedding).toBeNull();
  await page.getByLabel("More actions", { exact: true }).click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/knowledge\/archived$/);
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("Archived");
  await expect(
    page.getByRole("button", { name: "Publish", exact: true }),
  ).toHaveCount(0);
  await capture("archived-desktop");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(editorStatus("Draft")).toBeVisible();
  expect((await savedItem()).embedding).toBeNull();
  await page.getByLabel("More actions", { exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await savedItem()).id).toBe(itemIds.get("faq"));
  await page.getByLabel("More actions", { exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/knowledge$/);
  const deleted = await user
    .from("knowledge_items")
    .select("id")
    .eq("id", itemIds.get("faq")!);
  expect(deleted.error).toBeNull();
  expect(deleted.data).toEqual([]);

  await page.getByLabel("Organize knowledge", { exact: true }).click();
  await page
    .getByRole("link", { name: "Manage collections", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rename Services", exact: true })
    .click();
  await page
    .getByLabel("Collection name", { exact: true })
    .fill("Design services");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Design services", exact: true }),
  ).toBeVisible();
  expect(
    (
      await user
        .from("knowledge_collections")
        .select("name")
        .eq("id", collection.data!.id)
        .single()
    ).data?.name,
  ).toBe("Design services");
  await page.goto(`/app/knowledge?collection=${collection.data!.id}`);
  await expect(rows).toHaveCount(5);

  // Real file upload opens the persisted Draft for review; publication stays explicit.
  await page.goto("/app/knowledge/import?source=file");
  await page
    .getByLabel("Choose file", { exact: true })
    .setInputFiles({
      name: "business-facts.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Our business offers logo design and custom identity projects.",
      ),
    });
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Review imported knowledge",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("File imported as draft", { exact: true }),
  ).toBeVisible();
  await expect(editorStatus("Draft")).toBeVisible();
  let imported = await savedItem();
  expect(imported.type).toBe("custom_note");
  expect(imported.embedding).toBeNull();
  expect(imported.status).toBe("draft");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("import-review-mobile");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(editorStatus("Published")).toBeVisible();
  imported = await savedItem();
  expect(imported.status).toBe("published");
  expect(imported.embedding).not.toBeNull();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app/knowledge/import?source=webpage");
  await page
    .getByLabel("Website URL", { exact: true })
    .fill("http://localhost/private");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(
    page.locator(".knowledge-import-form").getByRole("alert"),
  ).toHaveText("Local or private network addresses cannot be imported.");
  await expect(
    page.getByRole("link", { name: "Add manually instead", exact: true }),
  ).toBeVisible();
  await capture("webpage-import-error");

  const foreignEmail = `foreign-${randomUUID()}@example.test`;
  expect(
    (
      await admin.auth.admin.createUser({
        email: foreignEmail,
        password,
        email_confirm: true,
      })
    ).error,
  ).toBeNull();
  const foreign = client(process.env.SUPABASE_PUBLISHABLE_KEY!);
  expect(
    (await foreign.auth.signInWithPassword({ email: foreignEmail, password }))
      .error,
  ).toBeNull();
  const foreignWorkspace = await foreign.rpc("create_workspace", {
    business_name: "Separate private workspace",
  });
  expect(foreignWorkspace.error).toBeNull();
  const foreignItem = await foreign.rpc("save_business_knowledge", {
    target_workspace_id: foreignWorkspace.data!,
    target_item_id: null,
    item_type: "custom_note",
    item_title: "Private tenant secret",
    item_content: "Private details never visible to other tenants.",
    expected_revision: null,
    item_price_statement: "",
    item_currency: "",
    item_details: "",
    item_collection_id: null,
  });
  expect(foreignItem.error).toBeNull();
  const inaccessible = await page.goto(`/app/knowledge/${foreignItem.data}`);
  // A streamed Next.js response can retain HTTP 200; access must still render
  // the not-found boundary and exclude the foreign item from HTML and UI.
  await expect(page.getByRole("heading", { name: "This page has wandered off.", exact: true })).toBeVisible();
  expect(await inaccessible!.text()).not.toContain("Private tenant secret");
  await expect(
    page.getByText("Private tenant secret", { exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await user
        .from("knowledge_items")
        .select("id")
        .eq("id", foreignItem.data!)
    ).data,
  ).toEqual([]);
  const denied = await user.rpc("change_knowledge_status", {
    target_workspace_id: foreignWorkspace.data!,
    target_item_id: foreignItem.data!,
    target_status: "draft",
  });
  expect(denied.error).not.toBeNull();
});
