import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import type { Database } from "@avenlyo-app/shared";

test("Agent V2 keeps settings, Knowledge, languages and conversation routing isolated", async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:55321");
  const client = (key: string) =>
    createClient<Database>(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  const admin = client(process.env.SUPABASE_SERVICE_ROLE_KEY!),
    owner = client(process.env.SUPABASE_PUBLISHABLE_KEY!);
  const email = `agents-${randomUUID()}@example.test`,
    password = `Local-agents-${randomUUID()}!`;
  const user = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(user.error).toBeNull();
  expect(
    (await owner.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  const workspace = await owner.rpc("create_workspace", {
    business_name: "Agent Studio",
  });
  expect(workspace.error).toBeNull();
  const wid = workspace.data!;
  expect(
    (
      await owner.rpc("save_agent_settings", {
        target_workspace_id: wid,
        settings: {
          tone: "professional",
          goals: [
            "answer_questions",
            "identify_interest",
            "qualify_inquiries",
            "collect_contact",
            "human_handoff",
          ],
          contact_fields: ["name", "email"],
          human_handoff_enabled: true,
          setup_brief: "Help customers with our published services.",
        },
      })
    ).error,
  ).toBeNull();
  const initial = await owner
    .from("agents")
    .select("*")
    .eq("workspace_id", wid)
    .eq("is_default", true)
    .single();
  expect(initial.error).toBeNull();
  const aid = initial.data!.id;
  const knowledge: string[] = [];
  for (const [title, content] of [
    ["Logo design", "We provide logo design for small businesses."],
    [
      "Furniture restoration",
      "We restore wooden furniture for local businesses.",
    ],
  ]) {
    const item = await owner.rpc("save_business_knowledge", {
      target_workspace_id: wid,
      target_item_id: null,
      item_type: "custom_note",
      item_title: title,
      item_content: content,
      expected_revision: null,
      item_price_statement: "",
      item_currency: "",
      item_details: "",
      item_collection_id: null,
    });
    expect(item.error).toBeNull();
    knowledge.push(item.data!);
    expect(
      (
        await admin.rpc("publish_knowledge_item", {
          actor_id: user.data.user!.id,
          target_workspace_id: wid,
          target_item_id: item.data!,
          expected_revision: 1,
          item_embedding: JSON.stringify([1, ...Array(1535).fill(0)]),
        })
      ).error,
    ).toBeNull();
  }
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.goto(`/app/test-agent?agent=${aid}`);
  await expect(
    page.getByRole("heading", { name: "Testing Front Office", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Message your agent", { exact: true })
    .fill("What services do you offer?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".thread-messages .message")).toHaveCount(2);
  expect(
    (
      await owner.rpc("complete_onboarding_without_channel", {
        target_workspace_id: wid,
      })
    ).error,
  ).toBeNull();
  await page.goto("/app");
  await expect(
    page.getByRole("heading", {
      name: "Your front office is ready",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/app/agent");
  await expect(
    page.getByRole("heading", { name: "Agents", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".agent-library-row")).toHaveCount(1);
  await expect(page.locator(".agent-library-row")).toContainText("Ready");
  await page.getByRole("button", { name: "Create agent", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Create agent", exact: true });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Create agent", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close dialog", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create agent", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Create agent", exact: true }).click();
  await dialog
    .getByLabel("Agent name", { exact: true })
    .fill("Restoration Assistant");
  await dialog
    .getByLabel("What should this agent help with?", { exact: true })
    .fill("Help customers understand furniture restoration.");
  await dialog
    .getByLabel("Primary language", { exact: true })
    .selectOption("en");
  await dialog
    .getByRole("button", { name: "Create agent", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Restoration Assistant", exact: true }),
  ).toBeVisible();
  const bid = new URL(page.url()).pathname.split("/").at(-1)!;
  const edit = async (field: string) => {
    await page
      .getByRole("button", { name: `Edit ${field}`, exact: true })
      .click();
    return page.getByRole("dialog", { name: `Edit ${field}`, exact: true });
  };
  const save = async (d: ReturnType<typeof page.getByRole>) => {
    await d.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(d).not.toBeVisible();
    await expect(page.getByRole("status")).toContainText("Changes saved");
  };
  dialog = await edit("name");
  await dialog
    .getByLabel("Agent name", { exact: true })
    .fill("Restoration Desk");
  await save(dialog);
  await expect(
    page.getByRole("heading", { name: "Restoration Desk", exact: true }),
  ).toBeVisible();
  dialog = await edit("role");
  await dialog
    .getByLabel("What should this agent help customers with?", { exact: true })
    .fill(
      "Answer furniture restoration questions and collect project contacts.",
    );
  await save(dialog);
  dialog = await edit("communication style");
  await dialog.getByRole("radio", { name: /Warm/ }).check();
  await save(dialog);
  await expect(
    page.getByRole("tabpanel").getByText("Warm", { exact: true }),
  ).toBeVisible();
  dialog = await edit("customer handling");
  await dialog
    .getByRole("checkbox", { name: "Collect contact details", exact: true })
    .uncheck();
  await save(dialog);
  await expect(page.getByText("Not collected", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit contact details", exact: true }),
  ).toHaveCount(0);
  dialog = await edit("customer handling");
  await dialog
    .getByRole("checkbox", { name: "Collect contact details", exact: true })
    .check();
  await save(dialog);
  dialog = await edit("contact details");
  await dialog.getByRole("checkbox", { name: "Name", exact: true }).uncheck();
  await dialog.getByRole("checkbox", { name: "Email", exact: true }).uncheck();
  await dialog.getByRole("checkbox", { name: "Phone", exact: true }).check();
  await save(dialog);
  await expect(
    page.getByText("Always available", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Edit human handoff/ }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Configuration preview")).toHaveCount(0);
  // Unsaved focused edits can be cancelled without changing the persisted name.
  dialog = await edit("name");
  await dialog.getByLabel("Agent name").fill("Discard me");
  page.once("dialog", (d) => d.accept());
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Restoration Desk", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Knowledge", exact: true }).click();
  await page.getByRole("radio", { name: /Selected knowledge/ }).check();
  await page
    .getByRole("button", { name: "Manage selection", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Select knowledge", exact: true });
  await dialog
    .getByRole("checkbox", { name: "Furniture restoration", exact: true })
    .check();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Save knowledge scope", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Knowledge scope saved");
  await page.getByRole("tab", { name: "Languages", exact: true }).click();
  await page.getByRole("button", { name: "Change", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Edit languages", exact: true });
  await dialog.getByLabel("Find a language").fill("Turkish");
  await dialog.getByRole("checkbox", { name: "Turkish", exact: true }).check();
  await dialog
    .getByRole("button", { name: "Save languages", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".agent-language-list")).toContainText("Turkish");
  await page.getByRole("button", { name: "Change", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Edit languages", exact: true });
  await dialog.getByLabel("Find a language").fill("Turkish");
  await dialog
    .getByRole("checkbox", { name: "Turkish", exact: true })
    .uncheck();
  await dialog.getByLabel("Primary language").selectOption("tr");
  await dialog
    .getByRole("button", { name: "Save languages", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText("Turkish");
  const persisted = await owner
    .from("agents")
    .select("*")
    .eq("id", bid)
    .single();
  expect(persisted.data).toMatchObject({
    name: "Restoration Desk",
    tone: "warm",
    contact_fields: ["phone"],
    primary_language: "tr",
    additional_languages: [],
    knowledge_mode: "selected",
  });
  expect(
    (
      await owner
        .from("agents")
        .select("tone,contact_fields,primary_language")
        .eq("id", aid)
        .single()
    ).data,
  ).toMatchObject({
    tone: "professional",
    contact_fields: ["name", "email"],
    primary_language: "en",
  });
  await page
    .locator(".agent-workspace")
    .getByRole("link", { name: "Test agent", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Testing Restoration Desk",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Message your agent")
    .fill("Hangi hizmetleri sunuyorsunuz?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".thread-messages .message")).toHaveCount(2);
  await expect(page.locator(".message-source")).toContainText(
    "Furniture restoration",
  );
  await expect(page.locator(".message-source")).not.toContainText(
    "Logo design",
  );
  expect(
    (
      await owner
        .from("conversations")
        .select("id,agent_id")
        .eq("workspace_id", wid)
        .eq("channel", "test_agent")
    ).data
      ?.map((c) => c.agent_id)
      .sort(),
  ).toEqual([aid, bid].sort());
  expect(
    (
      await owner.rpc("change_knowledge_status", {
        target_workspace_id: wid,
        target_item_id: knowledge[1],
        target_status: "draft",
      })
    ).error,
  ).toBeNull();
  await page.goto(`/app/agent/${bid}/knowledge`);
  await expect(page.getByRole("status")).toContainText(
    "1 selected item is currently unavailable",
  );
  // Deliberate channel assignment, immutable old ownership and real activation.
  await page.goto("/app/channels");
  await page.getByLabel("Agent", { exact: true }).selectOption(aid);
  await page
    .getByLabel("Approved websites", { exact: true })
    .fill("https://agents.example");
  await page.getByRole("checkbox", { name: "Enable Website Chat" }).check();
  await page.getByRole("button", { name: "Save channel", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ready");
  const channel = (
    await owner
      .from("channel_connections")
      .select("*")
      .eq("workspace_id", wid)
      .single()
  ).data!;
  expect(channel.agent_id).toBe(aid);
  expect(
    (
      await admin.rpc("create_website_session", {
        public_channel_id: channel.public_id,
        request_origin: "https://agents.example",
        credential_hash: "a".repeat(64),
      })
    ).error,
  ).toBeNull();
  await page.getByLabel("Agent", { exact: true }).selectOption(bid);
  await page.getByRole("button", { name: "Save channel", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ready");
  expect(
    (
      await admin.rpc("create_website_session", {
        public_channel_id: channel.public_id,
        request_origin: "https://agents.example",
        credential_hash: "b".repeat(64),
      })
    ).error,
  ).toBeNull();
  const inbound = await owner
    .from("conversations")
    .select("agent_id")
    .eq("workspace_id", wid)
    .eq("channel", "website_chat");
  expect(inbound.data?.map((c) => c.agent_id).sort()).toEqual(
    [aid, bid].sort(),
  );
  await page.goto("/app");
  await expect(
    page.getByRole("heading", {
      name: "Your front office is live",
      exact: true,
    }),
  ).toBeVisible();
  await mkdir("test-results/screenshots/agents", { recursive: true });
  const capture = async (name: string) => {
    const path = `test-results/screenshots/agents/${name}.png`;
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(name, { path, contentType: "image/png" });
  };
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [route, name] of [
      ["/app/agent", "library"],
      [`/app/agent/${bid}`, "general"],
      [`/app/agent/${bid}/knowledge`, "knowledge"],
      [`/app/agent/${bid}/languages`, "languages"],
    ]) {
      await page.goto(route);
      await expect(page.locator(".agent-workspace h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${name} ${width}`,
      ).toBe(true);
      await capture(`${name}-${width}`);
    }
    await page.goto("/app/agent");
    await page
      .getByRole("button", { name: "Create agent", exact: true })
      .click();
    dialog = page.getByRole("dialog", { name: "Create agent", exact: true });
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    if (width > 700)
      expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(3);
    await capture(`create-${width}`);
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/app/agent/${bid}`);
  await page
    .getByRole("button", { name: "Archive agent", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Archive agent", exact: true });
  await dialog
    .getByRole("button", { name: "Archive agent", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Move this agent's channels",
  );
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    (
      await owner.rpc("assign_channel_agent", {
        target_workspace_id: wid,
        target_connection_id: channel.id,
        target_agent_id: aid,
      })
    ).error,
  ).toBeNull();
  await page
    .getByRole("button", { name: "Archive agent", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Archive agent", exact: true });
  await dialog
    .getByRole("button", { name: "Archive agent", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/agent$/);
  await expect(page.locator(".agent-library-row")).toHaveCount(1);
  expect(
    (
      await owner
        .from("conversations")
        .select("agent_id")
        .eq("workspace_id", wid)
        .eq("agent_id", bid)
    ).data?.length,
  ).toBe(2);
});
