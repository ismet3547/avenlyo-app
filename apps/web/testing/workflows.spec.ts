import { test, expect, type Page } from "@playwright/test";
import { ids } from "./fixture";
const fixtureUrl = "http://127.0.0.1:55431";
async function signIn(page: Page) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Fictional-password-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
}
test.beforeEach(async ({ page, request }) => {
  await request.post(`${fixtureUrl}/__fixture/reset`);
  await signIn(page);
});

test("all requested routes fit five representative widths and keep one primary heading", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  const routes = [
    "/auth/sign-in",
    "/auth/sign-up",
    "/workspaces",
    "/app",
    "/app/agent",
    "/app/knowledge",
    "/app/knowledge/new",
    `/app/knowledge/${ids.knowledge}`,
    "/app/test-agent",
    "/app/leads",
    `/app/leads/${ids.lead}`,
    "/app/conversations",
    `/app/conversations/${ids.longTest}`,
    "/app/inbox",
    `/app/inbox/${ids.inbox}`,
    "/app/channels",
    "/app/settings",
  ];
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `No page overflow: ${width}px ${route}`,
      ).toBe(true);
      if (
        [320, 1440].includes(width) &&
        [
          "/app",
          "/app/knowledge",
          "/app/leads",
          "/app/channels",
          `/app/inbox/${ids.inbox}`,
        ].includes(route)
      ) {
        await page.screenshot({
          path: testInfo.outputPath(`${width}-${route.split("/").at(-1)}.png`),
          fullPage: true,
        });
      }
    }
  }
});

test("mobile navigation supports Escape, link dismissal and a distinct Test Agent active state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "Test Agent", exact: true }).click();
  await expect(page).toHaveURL(/test-agent$/);
  await expect(dialog).not.toBeVisible();
  await trigger.click();
  await expect(
    dialog.getByRole("link", { name: "Test Agent", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    dialog.getByRole("link", { name: "Agent", exact: true }),
  ).not.toHaveAttribute("aria-current");
});

test("switching workspace remounts forms with the selected business values", async ({
  page,
}) => {
  await page.goto("/app/agent");
  await page
    .getByLabel("What should Avenlyo help your customers with?", {
      exact: true,
    })
    .fill("Unsaved first workspace draft");
  await page.getByLabel("Workspace", { exact: true }).selectOption(ids.second);
  await page.getByRole("button", { name: "Switch", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/agent");
  await expect(
    page.getByLabel("What should Avenlyo help your customers with?", {
      exact: true,
    }),
  ).toHaveValue("Second workspace note");
  await expect(page.getByLabel("Tone", { exact: true })).toHaveValue("warm");
});

test("a stale form in another tab cannot rename the newly selected workspace", async ({
  page,
  context,
  request,
}) => {
  await page.goto("/app/settings");
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Wrong business overwrite");
  const other = await context.newPage();
  await other.goto("/app");
  await other.getByLabel("Workspace", { exact: true }).selectOption(ids.second);
  await other.getByRole("button", { name: "Switch", exact: true }).click();
  await expect(other).toHaveURL(/\/app$/);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "active workspace changed",
  );
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Wrong business overwrite",
  );
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(state.workspaces.map((w: { name: string }) => w.name)).toEqual([
    "Northstar Studio",
    "Second Workspace",
  ]);
  expect(state.mutations).toHaveLength(0);
});

test("agent goals explain disabled contact collection and save a valid supported configuration", async ({
  page,
  request,
}) => {
  await page.goto("/app/agent");
  await page
    .getByRole("checkbox", { name: /Collect contact details/ })
    .uncheck();
  await expect(page.getByRole("checkbox", { name: /^email$/i })).toBeDisabled();
  await expect(
    page.getByText("Internal planning note", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Agent settings saved");
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(state.settings[0].contact_fields).toEqual([]);
  expect(state.settings[0].goals).toContain("human_handoff");
  await expect(
    page.getByRole("link", { name: "Test saved settings →" }),
  ).toBeVisible();
});

test("knowledge preserves a rejected draft and completes publish, edit, archive and delete", async ({
  page,
  request,
}) => {
  await page.goto("/app/knowledge/new");
  await page
    .getByLabel("Title", { exact: true })
    .fill("Customer support hours");
  await page
    .getByLabel("Content", { exact: true })
    .fill("Our team can help on weekdays from 9am to 5pm.");
  await request.post(`${fixtureUrl}/__fixture/control`, {
    data: { failNextSave: true },
  });
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Could not save",
  );
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Customer support hours",
  );
  await expect(page.getByLabel("Content", { exact: true })).toHaveValue(
    "Our team can help on weekdays from 9am to 5pm.",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Draft saved" }),
  ).toBeVisible();
  const itemId = new URL(page.url()).searchParams.get("item")!;
  const item = () => page.locator(`[id="knowledge-${itemId}"]`);
  await item().getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Published." }),
  ).toBeVisible();
  await item().getByRole("link", { name: "Edit item" }).click();
  await expect(
    page.getByText("Saving unpublishes this item.", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Content", { exact: true })
    .fill("Updated support hours: weekdays, 10am to 6pm.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(item().getByText("Draft", { exact: true })).toBeVisible();
  await item().getByRole("button", { name: "Archive", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Archive this knowledge?" })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(item().getByText("Draft", { exact: true })).toBeVisible();
  await item().getByRole("button", { name: "Archive", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Archive this knowledge?" })
    .getByRole("button", { name: "Archive item", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Item archived" }),
  ).toBeVisible();
  await item().getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Permanently delete this item?" })
    .getByRole("button", { name: "Confirm delete", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "permanently deleted" }),
  ).toBeVisible();
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(state.knowledge.some((k: { id: string }) => k.id === itemId)).toBe(
    false,
  );
});

test("list filters and pagination make older knowledge and leads reachable", async ({
  page,
}) => {
  for (const route of ["/app/knowledge", "/app/leads"]) {
    await page.goto(route);
    await expect(
      page.getByRole("navigation", { name: "Results pages" }),
    ).toContainText("1–20 of 23");
    await page.getByRole("link", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("navigation", { name: "Results pages" }),
    ).toContainText("21–23 of 23");
  }
  await page.goto("/app/knowledge?q=nonexistent");
  await expect(
    page.getByRole("link", { name: "View all knowledge", exact: true }),
  ).toBeVisible();
  await page.goto("/app/leads?qualification=needs_human");
  await expect(
    page.getByRole("heading", { name: "No leads match these filters" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View all leads", exact: true }),
  ).toBeVisible();
  await page.goto("/app/conversations?channel=website_chat");
  await expect(
    page.getByText("Test conversation", { exact: false }),
  ).toHaveCount(0);
});

test("long tests open at the latest context and saved conversation history is paginated", async ({
  page,
}) => {
  await page.goto(`/app/test-agent?conversation=${ids.longTest}`);
  await expect(
    page.getByText("Saved message 120", { exact: true }),
  ).toBeInViewport();
  await expect(page.getByText("Saved message 1", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("link", { name: "Read earlier messages" }).click();
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(
    page.getByText("Saved message 1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Saved message 120", { exact: true }),
  ).toHaveCount(0);
});

test("test turns retain their idempotency key when a completed response is lost", async ({
  page,
  request,
}) => {
  await page.goto("/app/test-agent");
  const keys: string[] = [];
  await page.route("**/api/agent/turn", async (route) => {
    keys.push(route.request().postDataJSON().idempotencyKey);
    if (keys.length === 1) {
      await route.fetch();
      await route.abort();
    } else await route.continue();
  });
  await page.getByLabel("Customer message").fill("Tell me about logo design.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry same message", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Retry same message", exact: true })
    .click();
  await expect(page).toHaveURL(/conversation=/);
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(
    state.messages.filter(
      (m: { content: string }) => m.content === "Tell me about logo design.",
    ),
  ).toHaveLength(1);
});

test("failed test resume is reported and a later confirmed resume unlocks the composer", async ({
  page,
  request,
}) => {
  await page.goto(`/app/test-agent?conversation=${ids.test}`);
  await page.getByLabel("Customer message").fill("I need a human.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume test AI", exact: true }),
  ).toBeVisible();
  await request.post(`${fixtureUrl}/__fixture/control`, {
    data: { failNextResume: true },
  });
  await page
    .getByRole("button", { name: "Resume test AI", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "could not be resumed",
  );
  await expect(page.getByLabel("Customer message")).toBeDisabled();
  await page
    .getByRole("button", { name: "Resume test AI", exact: true })
    .click();
  await expect(page.getByLabel("Customer message")).toBeEnabled();
});

test("a confirmed human reply stays confirmed when the subsequent refresh fails", async ({
  page,
  request,
}) => {
  await page.goto(`/app/inbox/${ids.inbox}`);
  await page
    .getByRole("button", { name: "Claim conversation", exact: true })
    .click();
  await expect(page.getByText("Claimed by you", { exact: true })).toBeVisible();
  await page.route(`**/api/inbox/${ids.inbox}`, async (route) => {
    if (route.request().method() === "GET")
      await route.fulfill({ status: 503, json: { code: "API_UNAVAILABLE" } });
    else await route.continue();
  });
  await page
    .getByLabel("Your human reply")
    .fill("A human reply confirmed before a failed refresh.");
  await page
    .getByRole("button", { name: "Send human reply", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "available to the website visitor",
  );
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Your action was saved",
  );
  await expect(page.getByLabel("Your human reply")).toBeEnabled();
  await expect(page.getByLabel("Your human reply")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Retry same reply", exact: true }),
  ).toHaveCount(0);
  await page.unroute(`**/api/inbox/${ids.inbox}`);
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click();
  await expect(
    page.getByText("A human reply confirmed before a failed refresh.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(
    state.messages.filter((m: { role: string }) => m.role === "human"),
  ).toHaveLength(1);
});

test("unconfirmed human replies replay one nonce and release never resumes AI", async ({
  page,
  request,
}) => {
  await page.goto(`/app/inbox/${ids.inbox}`);
  await page
    .getByRole("button", { name: "Claim conversation", exact: true })
    .click();
  await expect(page.getByText("Claimed by you", { exact: true })).toBeVisible();
  const nonces: string[] = [];
  await page.route(`**/api/inbox/${ids.inbox}`, async (route) => {
    const body =
      route.request().method() === "POST"
        ? route.request().postDataJSON()
        : null;
    if (body?.operation === "reply") {
      nonces.push(body.clientMessageId);
      if (nonces.length === 1) {
        await route.fetch();
        await route.abort();
        return;
      }
    }
    await route.continue();
  });
  await page.getByLabel("Your human reply").fill("One durable reply.");
  await page
    .getByRole("button", { name: "Send human reply", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry same reply", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Retry same reply", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "available to the website visitor",
  );
  expect(nonces).toHaveLength(2);
  expect(nonces[0]).toBe(nonces[1]);
  await page
    .getByRole("button", { name: "Release conversation", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "released. AI remains paused",
  );
  await page.getByRole("button", { name: "Resume AI", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Resume AI for this conversation?" })
    .getByRole("button", { name: "Resume AI", exact: true })
    .click();
  await expect(page.getByText("AI active", { exact: true })).toBeVisible();
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(
    state.messages.filter((m: { role: string }) => m.role === "human"),
  ).toHaveLength(1);
  expect(
    state.mutations.filter(
      (m: { operation: string }) => m.operation === "resume",
    ),
  ).toHaveLength(1);
});

test("Instagram unconfirmed delivery remains visible and the byte limit is enforced", async ({
  page,
}) => {
  await page.goto(`/app/inbox/${ids.instagram}`);
  await page
    .getByRole("button", { name: "Claim conversation", exact: true })
    .click();
  await expect(page.getByText("Claimed by you", { exact: true })).toBeVisible();
  await page.getByLabel("Your human reply").fill("ş".repeat(501));
  await expect(
    page.getByRole("button", { name: "Send human reply", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Your human reply")
    .fill("An unconfirmed Instagram reply.");
  await page
    .getByRole("button", { name: "Send human reply", exact: true })
    .click();
  await expect(
    page.getByText("Delivery unconfirmed · automatic resend stopped", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("AI remains paused");
});

test("channel validation preserves input, clipboard failure has a fallback and disconnect requires confirmation", async ({
  page,
  request,
}) => {
  await page.goto("/app/channels");
  await page
    .getByLabel("Approved website origins")
    .fill("https://example.com/invalid-path");
  await page
    .getByRole("button", { name: "Save Website Chat", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "exact HTTPS origins",
  );
  await expect(page.getByLabel("Approved website origins")).toHaveValue(
    "https://example.com/invalid-path",
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => Promise.reject(new Error("Blocked for fixture")),
      },
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Copy snippet", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Website embed code" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Disconnect Instagram", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Disconnect Instagram?" })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  let state = await (await request.get(`${fixtureUrl}/__fixture/state`)).json();
  expect(state.mutations).toHaveLength(0);
  await page
    .getByRole("button", { name: "Disconnect Instagram", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Disconnect Instagram?" })
    .getByRole("button", { name: "Disconnect Instagram", exact: true })
    .click();
  await expect(page.getByText("Disconnected", { exact: true })).toBeVisible();
  state = await (await request.get(`${fixtureUrl}/__fixture/state`)).json();
  expect(state.mutations).toHaveLength(1);
});

test("member permissions are explained and unsupported edits stay disabled", async ({
  page,
  request,
}) => {
  await request.post(`${fixtureUrl}/__fixture/control`, {
    data: { role: "member" },
  });
  await page.goto("/app/settings");
  await expect(
    page.getByText("You have member access.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Business name", { exact: true }),
  ).toBeDisabled();
  await page.goto("/app/agent");
  await expect(
    page.getByRole("button", { name: "Save settings", exact: true }),
  ).toBeDisabled();
  await page.goto("/app/knowledge/new");
  await expect(page).toHaveURL(/\/app\/knowledge$/);
  await expect(
    page.getByRole("link", { name: "Add knowledge", exact: true }),
  ).toHaveCount(0);
});

test("invalid saved test URLs fail visibly and auth callback failure explains recovery", async ({
  page,
}) => {
  await page.goto("/app/test-agent?conversation=invalid");
  await expect(
    page.getByRole("heading", { name: "This page is unavailable" }),
  ).toBeVisible();
  await page.goto("/auth/callback");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "confirmation link could not be verified",
  );
});

test("mobile Inbox exposes claiming before a long thread and keeps AI paused after replying", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto(`/app/inbox/${ids.inbox}`);
  const claim = page.getByRole("button", {
    name: "Claim conversation",
    exact: true,
  });
  await expect(claim).toBeInViewport();
  await claim.click();
  await expect(page.getByText("Claimed by you", { exact: true })).toBeVisible();
  await page.getByLabel("Your human reply").fill("A reply from mobile.");
  await page
    .getByRole("button", { name: "Send human reply", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "available to the website visitor",
  );
  await expect(
    page.getByText("Needs human · AI paused", { exact: true }),
  ).toBeVisible();
});
