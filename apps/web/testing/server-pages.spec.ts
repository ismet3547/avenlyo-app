import { test, expect, type APIRequestContext } from "@playwright/test";
import { ids } from "./fixture";
const fixtureUrl = "http://127.0.0.1:55431";
function decode(value: string) {
  return value.replace(
    /&(quot|amp|lt|gt|apos|#39);/g,
    (_, entity: string) =>
      ({ quot: '"', amp: "&", lt: "<", gt: ">", apos: "'", "#39": "'" })[
        entity
      ]!,
  );
}
function formFields(html: string, marker: string): Record<string, string> {
  const form = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].find(
    (match) => match[0].includes(marker),
  )?.[0];
  if (!form) throw new Error(`Form not found: ${marker}`);
  const fields: Record<string, string> = {};
  for (const tag of form.matchAll(/<input\b[^>]*>/g)) {
    const attributes = Object.fromEntries(
      [...tag[0].matchAll(/([\w:$-]+)="([^"]*)"/g)].map((match) => [
        match[1],
        decode(match[2]),
      ]),
    );
    if (attributes.name && attributes.type === "hidden")
      fields[attributes.name] = attributes.value ?? "";
  }
  return fields;
}
async function submit(
  request: APIRequestContext,
  path: string,
  fields: Record<string, string>,
) {
  return request.post(path, {
    multipart: fields,
    headers: { Origin: "http://localhost:3001" },
  });
}
test.beforeEach(async ({ request }) => {
  await request.post(`${fixtureUrl}/__fixture/reset`);
  const html = await (await request.get("/auth/sign-in")).text();
  const result = await submit(request, "/auth/sign-in", {
    ...formFields(html, 'name="email"'),
    email: "owner@example.test",
    password: "Fictional-password-123!",
  });
  expect(result.url()).toMatch(/\/app$/);
});

test("server renders every requested route with a primary heading and no application error", async ({
  request,
}) => {
  for (const route of [
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
  ]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    const html = await response.text();
    expect((html.match(/<h1(?:\s|>)/g) ?? []).length, route).toBe(1);
    expect(html, route).not.toContain("We could not load this workspace");
  }
});

test("workspace-bound server actions reject stale tabs and preserve draft values", async ({
  request,
}) => {
  const stale = formFields(
    await (await request.get("/app/settings")).text(),
    'id="business-name"',
  );
  const layout = await (await request.get("/app")).text();
  await submit(request, "/app", {
    ...formFields(layout, 'id="workspace-select"'),
    workspaceId: ids.second,
  });
  const response = await submit(request, "/app/settings", {
    ...stale,
    name: "Wrong workspace overwrite",
  });
  expect(await response.text()).toContain("Your active workspace changed");
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(state.mutations).toHaveLength(0);
  expect(state.workspaces.map((w: { name: string }) => w.name)).toEqual([
    "Northstar Studio",
    "Second Workspace",
  ]);
});

test("knowledge server actions report rejection and save confirmed drafts in the rendered workspace", async ({
  request,
}) => {
  const fields = formFields(
    await (await request.get("/app/knowledge/new")).text(),
    'id="knowledge-title"',
  );
  await request.post(`${fixtureUrl}/__fixture/control`, {
    data: { failNextSave: true },
  });
  const draft = {
    ...fields,
    type: "text",
    title: "Support hours",
    content: "We are open on weekdays from 9am to 5pm.",
  };
  const rejected = await submit(request, "/app/knowledge/new", draft);
  expect(await rejected.text()).toContain("Could not save this item");
  const saved = await submit(request, "/app/knowledge/new", draft);
  expect(saved.url()).toContain("notice=draft-saved");
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(
    state.knowledge.filter(
      (item: { title: string; workspace_id: string }) =>
        item.title === "Support hours" && item.workspace_id === ids.workspace,
    ),
  ).toHaveLength(1);
});

test("test and human reply endpoints replay durable keys without duplicate messages", async ({
  request,
}) => {
  const turn = {
    workspaceId: ids.workspace,
    conversationId: null,
    content: "A test inquiry.",
    idempotencyKey: "10000000-0000-4000-8000-000000000001",
  };
  for (let i = 0; i < 2; i++)
    expect(
      (
        await request.post("/api/agent/turn", {
          data: turn,
          headers: { Origin: "http://localhost:3001" },
        })
      ).status(),
    ).toBe(200);
  await request.post(`/api/inbox/${ids.inbox}`, {
    data: { operation: "claim" },
    headers: { Origin: "http://localhost:3001" },
  });
  const reply = {
    operation: "reply",
    content: "One human reply.",
    clientMessageId: "10000000-0000-4000-8000-000000000002",
  };
  for (let i = 0; i < 2; i++)
    expect(
      (
        await request.post(`/api/inbox/${ids.inbox}`, {
          data: reply,
          headers: { Origin: "http://localhost:3001" },
        })
      ).status(),
    ).toBe(200);
  await request.post(`/api/inbox/${ids.inbox}`, {
    data: { operation: "release" },
    headers: { Origin: "http://localhost:3001" },
  });
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(
    state.messages.filter(
      (m: { content: string }) => m.content === "One human reply.",
    ),
  ).toHaveLength(1);
  expect(
    state.messages.filter(
      (m: { content: string }) => m.content === "A test inquiry.",
    ),
  ).toHaveLength(1);
  expect(
    state.conversations.find((c: { id: string }) => c.id === ids.inbox).ai_mode,
  ).toBe("paused");
});

test("latest saved messages and earlier pages remain reachable through real page queries", async ({
  request,
}) => {
  const latest = await (
    await request.get(`/app/conversations/${ids.longTest}`)
  ).text();
  expect(latest).toContain("Saved message 120");
  expect(latest).not.toContain(">Saved message 1<");
  const earlier = await (
    await request.get(`/app/conversations/${ids.longTest}?page=1`)
  ).text();
  expect(earlier).toContain("Saved message 1");
  expect(earlier).not.toContain("Saved message 120");
  for (const route of ["/app/knowledge", "/app/leads"]) {
    expect(await (await request.get(`${route}?page=1`)).text()).toContain(
      "21–23 of 23",
    );
  }
});

test("resume errors and callback errors have explicit recovery feedback", async ({
  request,
}) => {
  await request.post("/api/agent/turn", {
    data: {
      workspaceId: ids.workspace,
      conversationId: ids.test,
      content: "I need a human.",
      idempotencyKey: "10000000-0000-4000-8000-000000000003",
    },
    headers: { Origin: "http://localhost:3001" },
  });
  const path = `/app/test-agent?conversation=${ids.test}`;
  const fields = formFields(
    await (await request.get(path)).text(),
    'name="conversationId"',
  );
  await request.post(`${fixtureUrl}/__fixture/control`, {
    data: { failNextResume: true },
  });
  expect(await (await submit(request, path, fields)).text()).toContain(
    "The test could not be resumed",
  );
  expect(await (await submit(request, path, fields)).text()).not.toContain(
    ">Test AI is paused<",
  );
  expect(await (await request.get("/auth/callback")).text()).toContain(
    "confirmation link could not be verified",
  );
});

test("workspace creation leads to an independent workspace overview", async ({
  request,
}) => {
  const fields = formFields(
    await (await request.get("/workspaces")).text(),
    'name="name"',
  );
  const response = await submit(request, "/workspaces", {
    ...fields,
    name: "Fresh Business",
  });
  expect(response.url()).toMatch(/\/app$/);
  expect(await response.text()).toContain("Fresh Business");
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(state.workspaces).toHaveLength(3);
});

test("agent actions save supported settings while retaining mandatory human handoff", async ({
  request,
}) => {
  const fields = formFields(
    await (await request.get("/app/agent")).text(),
    'id="setup-brief"',
  );
  const response = await submit(request, "/app/agent", {
    ...fields,
    goals: "answer_questions",
    tone: "warm",
    setup_brief: "Internal planning note",
  });
  expect(await response.text()).toContain("Agent settings saved");
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(state.settings[0].tone).toBe("warm");
  expect(state.settings[0].human_handoff_enabled).toBe(true);
  expect(state.settings[0].goals).toEqual([
    "answer_questions",
    "human_handoff",
  ]);
  expect(state.settings[0].contact_fields).toEqual([]);
});

test("channel actions reject invalid origins and confirm saved enable and disable states", async ({
  request,
}) => {
  const fields = formFields(
    await (await request.get("/app/channels")).text(),
    'id="website-origins"',
  );
  const rejected = await submit(request, "/app/channels", {
    ...fields,
    enabled: "on",
    origins: "https://example.test/path",
  });
  expect(await rejected.text()).toContain("exact HTTPS origins");
  const enabled = await submit(request, "/app/channels", {
    ...fields,
    enabled: "on",
    origins: "https://example.test",
  });
  expect(await enabled.text()).toContain("Website Chat is ready");
  const disabled = await submit(request, "/app/channels", {
    ...fields,
    origins: "https://example.test",
  });
  expect(await disabled.text()).toContain("Website Chat is disabled");
  const state = await (
    await request.get(`${fixtureUrl}/__fixture/state`)
  ).json();
  expect(
    state.channels.find(
      (channel: { channel: string }) => channel.channel === "website_chat",
    ).enabled,
  ).toBe(false);
});
