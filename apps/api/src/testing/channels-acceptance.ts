// Real disposable Auth/RLS/PostgreSQL/API; no live OpenAI, Meta or Resend.
import "dotenv/config";
import { randomUUID, createHmac } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import type {
  Database,
  InboxItem,
  InboxThread,
  TurnResult,
} from "@avenlyo-app/shared";
import { configSchema } from "../config.js";
import { buildApp } from "../app.js";
import type { AgentProvider } from "../runtime/provider.js";
import type {
  BusinessEmailProvider,
  InstagramTransport,
  SendOutcome,
} from "../channels/transports.js";
const config = configSchema.parse({
  ...process.env,
  OPENAI_API_KEY: undefined,
  RESEND_API_KEY: undefined,
  BUSINESS_NOTIFICATION_PROVIDER: "disabled",
  INSTAGRAM_APP_SECRET: "fictional-local-instagram-app-secret",
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "fictional-local-instagram-verify-token",
});
if (
  config.SUPABASE_URL !== "http://127.0.0.1:55321" ||
  !config.SUPABASE_PUBLISHABLE_KEY ||
  !config.SUPABASE_SERVICE_ROLE_KEY
)
  throw new Error(
    "Channels acceptance requires the independent disposable local stack and local keys.",
  );
const admin = createClient<Database>(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
let assertions = 0,
  modelCalls = 0,
  embeddingCalls = 0,
  failModel = false,
  humanHistorySeen = false;
function check(condition: unknown, description: string) {
  assert(condition, description);
  assertions++;
  console.info(`ok ${assertions} - ${description}`);
}
function localSql(sql: string) {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "supabase_db_avenlyo-app",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-c",
      sql,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error("Disposable fixture SQL failed");
  return result.stdout.trim();
}
async function account(label: string) {
  const email = `channels-${label}-${randomUUID()}@example.test`,
    password = `Fictional!${randomUUID()}`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user)
    throw new Error("Fictional staff creation failed");
  const client = createClient<Database>(
    config.SUPABASE_URL!,
    config.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session)
    throw new Error("Local staff sign-in failed");
  return {
    id: created.data.user.id,
    email,
    client,
    token: signed.data.session.access_token,
  };
}
const provider: AgentProvider = {
  detectLanguage: async (text) =>
    /merhaba|hizmet|fiyat/i.test(text) ? "tr" : "en",
  localize: async (text) => text,
  embed: async () => {
    embeddingCalls++;
    return [1, ...Array(1535).fill(0)];
  },
  respond: async (input) => {
    modelCalls++;
    if (failModel) throw new Error("Fictional provider failure");
    if (input.history.some((m) => m.role === "human")) humanHistorySeen = true;
    if (input.instructions.includes("Never hand customers to a human"))
      throw new Error("Setup brief entered policy");
    assert(
      input.knowledge.every((k) => !k.content.includes("UNPUBLISHED_SECRET")),
    );
    const text = input.history
      .filter((m) => m.role === "customer")
      .map((m) => m.content)
      .join("\n");
    return {
      reply:
        "Northstar Studio provides logo design for small businesses. Share the scope of your design project.",
      request_human: true,
      interest: /interested|looking for|want|need/i.test(text)
        ? "service"
        : "general",
      name: text.match(/(?:I'm|My name is) (Alex|Riley)\b/i)?.[1] ?? null,
      email: text.match(/(?:alex|riley)@example\.test/i)?.[0] ?? null,
      phone: null,
      company: null,
    };
  },
};
let emailState: SendOutcome["state"] = "sent",
  instagramState: SendOutcome["state"] = "sent";
const emails: Parameters<BusinessEmailProvider["send"]>[0][] = [],
  sends: Parameters<InstagramTransport["send"]>[0][] = [];
const emailProvider: BusinessEmailProvider = {
  send: async (input) => {
    emails.push(input);
    return {
      state: emailState,
      providerMessageId:
        emailState === "sent" ? `fake-email-${emails.length}` : undefined,
      code:
        emailState === "sent"
          ? undefined
          : emailState === "unknown"
            ? "EMAIL_OUTCOME_UNKNOWN"
            : "EMAIL_REJECTED",
    };
  },
};
const instagramTransport: InstagramTransport = {
  send: async (input) => {
    sends.push(input);
    return {
      state: instagramState,
      providerMessageId:
        instagramState === "sent"
          ? `fake-instagram-${sends.length}`
          : undefined,
      code: instagramState === "unknown" ? "META_OUTCOME_UNKNOWN" : undefined,
    };
  },
};
const app = await buildApp({
  config,
  provider,
  emailProvider,
  instagramTransport,
  backgroundChannels: false,
  logger: false,
});
const origin = "http://localhost:3001";
const authCountBefore = Number(localSql("select count(*) from auth.users"));
const a = await account("owner-a"),
  b = await account("owner-b"),
  member = await account("member");
const wa = await a.client.rpc("create_workspace", {
    business_name: "Northstar Studio",
  }),
  wb = await b.client.rpc("create_workspace", {
    business_name: "Other Fictional Studio",
  });
if (wa.error || wb.error) throw new Error("Local workspace creation failed");
const workspace = wa.data,
  foreign = wb.data;
localSql(
  `insert into public.workspace_members(workspace_id,user_id,role) values('${workspace}','${member.id}','member')`,
);
async function team(
  token: string,
  id: string,
  operation: "thread" | "action" | "reply",
  body: object = {},
) {
  return app.inject({
    method: "POST",
    url: `/v1/inbox/${id}/${operation}`,
    headers: { authorization: `Bearer ${token}` },
    payload: { workspaceId: workspace, ...body },
  });
}
async function thread(token: string, id: string) {
  const response = await team(token, id, "thread");
  check(
    response.statusCode === 200,
    "Authorized Inbox thread loads through the API",
  );
  return response.json<InboxThread>();
}
async function configure(enabled: boolean) {
  const result = await a.client.rpc("configure_website_channel", {
    target_workspace_id: workspace,
    channel_enabled: enabled,
    origins: [origin, "https://northstar.example"],
  });
  if (result.error) throw new Error("Website configuration failed");
}
await configure(true);
const channel = await a.client
  .from("channel_connections")
  .select("public_id")
  .eq("workspace_id", workspace)
  .eq("channel", "website_chat")
  .single();
if (channel.error) throw new Error("Channel lookup failed");
const publicId = channel.data.public_id;
const prefix = `/v1/public/website/${publicId}`;
async function session() {
  const response = await app.inject({
    method: "POST",
    url: prefix + "/sessions",
    headers: { origin },
    payload: {},
  });
  check(
    response.statusCode === 201,
    "Approved fictional origin obtains a visitor session without sign-in",
  );
  return response.json<{
    credential: string;
    businessName: string;
    expiresAt: string;
  }>();
}
async function visitor(
  credential: string,
  content: string,
  clientMessageId = randomUUID(),
) {
  const input = { clientMessageId, content };
  const response = await app.inject({
    method: "POST",
    url: prefix + "/messages",
    headers: { origin, authorization: `Bearer ${credential}` },
    payload: input,
  });
  return { response, input };
}
async function websiteThread(credential: string) {
  const response = await app.inject({
    method: "GET",
    url: prefix + "/thread",
    headers: { origin, authorization: `Bearer ${credential}` },
  });
  check(
    response.statusCode === 200,
    "Visitor reads only their mapped channel thread",
  );
  return response.json<{
    needsHuman: boolean;
    messages: { id: string; role: string; content: string }[];
  }>();
}
function signed(
  accountId: string,
  senderId: string,
  content: string,
  mid = `mid-${randomUUID()}`,
  timestamp = Date.now(),
) {
  const raw = JSON.stringify({
    object: "instagram",
    workspaceId: foreign,
    entry: [
      {
        id: accountId,
        workspaceId: foreign,
        messaging: [
          {
            sender: { id: senderId },
            recipient: { id: accountId },
            timestamp,
            message: { mid, text: content },
            workspaceId: foreign,
          },
        ],
      },
    ],
  });
  const signature =
    "sha256=" +
    createHmac("sha256", config.INSTAGRAM_APP_SECRET!)
      .update(raw)
      .digest("hex");
  return { raw, signature };
}
async function webhook(event: { raw: string; signature: string }) {
  return app.inject({
    method: "POST",
    url: "/v1/webhooks/instagram",
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": event.signature,
    },
    payload: event.raw,
  });
}
try {
  const knowledge = await a.client.rpc("save_knowledge_item", {
    target_workspace_id: workspace,
    target_item_id: null,
    item_type: "text",
    item_title: "Logo design",
    item_content:
      "Northstar Studio provides logo design for small businesses. Share project scope to discuss suitable design options.",
    expected_revision: null,
  });
  if (knowledge.error) throw new Error("Knowledge draft failed");
  await a.client.rpc("save_knowledge_item", {
    target_workspace_id: workspace,
    target_item_id: null,
    item_type: "text",
    item_title: "Private draft",
    item_content: "UNPUBLISHED_SECRET must not be used.",
    expected_revision: null,
  });
  const publication = await app.inject({
    method: "POST",
    url: `/v1/knowledge/${knowledge.data}/publish`,
    headers: { authorization: `Bearer ${a.token}` },
    payload: { workspaceId: workspace },
  });
  check(
    publication.statusCode === 200,
    "Existing knowledge publication powers real channel retrieval",
  );
  check(
    (
      await app.inject({
        method: "POST",
        url: prefix + "/sessions",
        headers: { origin: "https://unknown.example" },
        payload: {},
      })
    ).statusCode === 403,
    "Unknown Origin cannot obtain a session",
  );
  await configure(false);
  check(
    (
      await app.inject({
        method: "POST",
        url: prefix + "/sessions",
        headers: { origin },
        payload: {},
      })
    ).statusCode === 403,
    "Disabled Website Chat refuses sessions",
  );
  await configure(true);
  const s = await session();
  check(
    s.credential.length === 43 && !JSON.stringify(s).includes(workspace),
    "Visitor credential is opaque and returns no workspace authority",
  );
  check(
    (
      await app.inject({
        method: "POST",
        url: prefix + "/messages",
        headers: { origin, authorization: `Bearer ${s.credential}` },
        payload: {
          clientMessageId: randomUUID(),
          content: "Hello",
          workspaceId: foreign,
        },
      })
    ).statusCode === 400,
    "Visitor-supplied workspace ID is rejected",
  );
  check(
    (
      await app.inject({
        method: "GET",
        url: prefix + "/thread",
        headers: { origin, authorization: `Bearer ${"x".repeat(43)}` },
      })
    ).statusCode === 403,
    "Invalid session is denied",
  );
  localSql(
    `update public.website_sessions set expires_at=now()-interval '1 second' where connection_id=(select id from public.channel_connections where public_id='${publicId}')`,
  );
  check(
    (
      await app.inject({
        method: "GET",
        url: prefix + "/thread",
        headers: { origin, authorization: `Bearer ${s.credential}` },
      })
    ).statusCode === 403,
    "Expired session is denied",
  );
  localSql(
    `update public.website_sessions set expires_at=now()+interval '7 days' where connection_id=(select id from public.channel_connections where public_id='${publicId}')`,
  );
  const first = await visitor(
    s.credential,
    "I'm interested in your logo design.",
  );
  check(
    first.response.statusCode === 200,
    "Website inquiry uses FrontOfficeRuntime",
  );
  const firstThread = await websiteThread(s.credential);
  check(
    firstThread.messages.some(
      (m) => m.role === "assistant" && m.content.includes("logo design"),
    ),
    "Website answer is grounded in published knowledge",
  );
  check(
    !firstThread.needsHuman,
    "Model handoff advice cannot pause an answerable real inquiry",
  );
  const contact = await visitor(
    s.credential,
    "I'm Alex. My email is alex@example.test.",
  );
  check(
    contact.response.statusCode === 200,
    "Customer-stated name/email use the existing lead validation",
  );
  const lead = await a.client
    .from("leads")
    .select("*")
    .eq("workspace_id", workspace)
    .eq("source", "website_chat")
    .single();
  if (lead.error) throw new Error("Website lead unavailable");
  const id = lead.data.conversation_id;
  check(
    lead.data.name === "Alex" &&
      lead.data.email === "alex@example.test" &&
      lead.data.qualification === "qualified",
    "One website_chat qualified lead has customer-stated fields",
  );
  check(
    emails.length === 1 && emails[0].to === a.email,
    "New qualified real lead emits one owner-derived staff email",
  );
  const calls = modelCalls;
  const replay = await visitor(
    s.credential,
    contact.input.content,
    contact.input.clientMessageId,
  );
  check(
    replay.response.statusCode === 200 &&
      replay.response.json().replayed === true &&
      modelCalls === calls,
    "Duplicate visitor message replays without another model call",
  );
  check(
    emails.length === 1,
    "Duplicate visitor input does not send duplicate staff email",
  );
  check(
    (await team(b.token, id, "thread")).statusCode === 403,
    "Cross-workspace Inbox thread is denied",
  );
  check(
    (await team(b.token, id, "action", { action: "claim" })).statusCode === 403,
    "Unauthorized team user cannot claim",
  );
  for (const table of [
    "channel_connections",
    "website_sessions",
    "channel_events",
    "conversations",
    "messages",
    "leads",
    "message_deliveries",
    "business_notifications",
  ] as const) {
    const result = await b.client
      .from(table)
      .select("id")
      .eq("workspace_id", workspace);
    check(
      !result.error && result.data.length === 0,
      `Workspace B cannot read A ${table}`,
    );
  }
  const human = await visitor(s.credential, "I want to speak with a person.");
  check(
    human.response.statusCode === 200 &&
      human.response.json().needsHuman === true &&
      modelCalls === calls,
    "Explicit human request pauses AI without invoking the model",
  );
  check(
    emails.length === 2,
    "New human-assistance request emits one staff email",
  );
  const inbox = await a.client.rpc("inbox_snapshot", {
    target_workspace_id: workspace,
    page_offset: 0,
  });
  check(
    (inbox.data as unknown as InboxItem[]).some(
      (c) => c.id === id && c.aiMode === "paused",
    ),
    "Inbox surfaces the real needs-human conversation",
  );
  check(
    (await team(member.token, id, "action", { action: "claim" })).statusCode ===
      200,
    "Active member claims the real thread",
  );
  check(
    (await team(a.token, id, "action", { action: "resume" })).statusCode ===
      403,
    "Another member cannot reactivate a claimed thread",
  );
  const nonce = randomUUID(),
    humanBody = {
      clientMessageId: nonce,
      content: "Hi, this is Susan from Northstar Studio.",
    };
  const reply = await team(member.token, id, "reply", humanBody);
  check(
    reply.statusCode === 200 && reply.json().delivery.status === "available",
    "Human reply is saved for Website Chat delivery",
  );
  const replayHuman = await team(member.token, id, "reply", humanBody);
  check(
    replayHuman.json().messageId === reply.json().messageId,
    "Human reply replay keeps one durable message",
  );
  const visitorAfter = await websiteThread(s.credential);
  check(
    visitorAfter.needsHuman &&
      visitorAfter.messages.some(
        (m) => m.role === "human" && m.content === humanBody.content,
      ),
    "Visitor sees the HUMAN reply and AI remains paused",
  );
  const assistantCount = visitorAfter.messages.filter(
    (m) => m.role === "assistant",
  ).length;
  const follow = await visitor(s.credential, "Can you tell me more?");
  check(
    follow.response.statusCode === 200 && modelCalls === calls,
    "Paused customer follow-up does not invoke AI",
  );
  check(
    (await websiteThread(s.credential)).messages.filter(
      (m) => m.role === "assistant",
    ).length === assistantCount,
    "Paused follow-up creates no extra automatic reply",
  );
  check(
    (await team(member.token, id, "action", { action: "release" }))
      .statusCode === 200 &&
      (await thread(a.token, id)).conversation.ai_mode === "paused",
    "Release does not resume AI",
  );
  check(
    (await team(member.token, id, "action", { action: "resume" }))
      .statusCode === 200,
    "Team explicitly resumes AI",
  );
  const resumed = await visitor(
    s.credential,
    "What logo design services do you offer?",
  );
  check(
    resumed.response.statusCode === 200 &&
      modelCalls === calls + 1 &&
      humanHistorySeen,
    "Next question uses the same AI runtime with human thread history",
  );
  check(
    emails.length === 2,
    "Requalification after resume does not duplicate a notification",
  );
  const faqSession = await session();
  await visitor(faqSession.credential, "Do you work with small businesses?");
  const allLeads = await a.client
    .from("leads")
    .select("id")
    .eq("workspace_id", workspace);
  check(
    allLeads.data?.length === 1,
    "Ordinary FAQ traffic does not become a lead",
  );
  const failureSession = await session();
  emailState = "failed";
  const qualifiedFailure = await visitor(
    failureSession.credential,
    "I'm interested in your logo design. My name is Riley. My email is riley@example.test.",
  );
  check(
    qualifiedFailure.response.statusCode === 200,
    "Notification failure does not roll back a customer response",
  );
  const failureLead = await a.client
    .from("leads")
    .select("*")
    .eq("workspace_id", workspace)
    .eq("email", "riley@example.test")
    .single();
  check(
    !failureLead.error && failureLead.data.qualification === "qualified",
    "Notification failure leaves the qualified lead durable",
  );
  if (failureLead.error) throw new Error("Failure fixture lead unavailable");
  const n = await a.client
    .from("business_notifications")
    .select("status")
    .eq("conversation_id", failureLead.data.conversation_id);
  check(
    n.data?.some((item) => item.status === "failed"),
    "Staff email failure is visible in a durable ledger",
  );
  emailState = "unknown";
  const unknownMail = await visitor(
    failureSession.credential,
    "I want a human.",
  );
  const countMail = emails.length;
  await visitor(
    failureSession.credential,
    unknownMail.input.content,
    unknownMail.input.clientMessageId,
  );
  await app.processChannelWork();
  check(
    emails.length === countMail,
    "Ambiguous email result is never automatically resent",
  );
  emailState = "sent";
  const beforeTestEmails = emails.length;
  const test = await app.inject({
    method: "POST",
    url: "/v1/agent/turn",
    headers: { authorization: `Bearer ${a.token}` },
    payload: {
      workspaceId: workspace,
      conversationId: null,
      idempotencyKey: randomUUID(),
      content: "I want a human.",
    },
  });
  check(
    test.statusCode === 200 && emails.length === beforeTestEmails,
    "Test Agent remains protected and sends no staff email",
  );
  const testId = test.json<TurnResult>().conversationId;
  check(
    (
      await a.client
        .from("business_notifications")
        .select("id")
        .eq("conversation_id", testId)
    ).data?.length === 0,
    "Test Agent creates no notification record",
  );

  const igAccount = "17841400000123456",
    sender = "987654321";
  const provisioned = await admin.rpc("provision_instagram_channel", {
    target_workspace_id: workspace,
    expected_workspace_name: "Northstar Studio",
    provider_account_id: igAccount,
    provider_username: "northstar_fictional",
    provider_token: "fictional-instagram-provider-token",
    provider_version: "v26.0",
    verified_app_id: "123456789",
  });
  check(
    !provisioned.error,
    "Fictional verified Instagram fixture stores a Vault credential through the backend boundary",
  );
  const igFirst = signed(
    igAccount,
    sender,
    "I'm interested in your logo design.",
  );
  check(
    (await webhook(igFirst)).statusCode === 200,
    "Signed Instagram text is durably accepted",
  );
  await app.processChannelWork();
  check(
    sends.length === 1 && sends[0].text.includes("logo design"),
    "Normalized Instagram inquiry uses the same runtime and fake outbound transport",
  );
  const igContact = signed(
    igAccount,
    sender,
    "I'm Alex. My email is alex@example.test.",
  );
  await webhook(igContact);
  await app.processChannelWork();
  const igLead = await a.client
    .from("leads")
    .select("*")
    .eq("workspace_id", workspace)
    .eq("source", "instagram")
    .single();
  check(
    !igLead.error &&
      igLead.data.qualification === "qualified" &&
      igLead.data.conversation_id !== id,
    "Instagram has one separate qualified lead using the same validation",
  );
  if (igLead.error) throw new Error("Instagram lead unavailable");
  const igId = igLead.data.conversation_id;
  const beforeReplay = {
    sends: sends.length,
    emails: emails.length,
    model: modelCalls,
  };
  await webhook(igContact);
  await app.processChannelWork();
  check(
    sends.length === beforeReplay.sends &&
      emails.length === beforeReplay.emails &&
      modelCalls === beforeReplay.model,
    "Duplicate webhook creates no second model reply, send or email",
  );
  const igThread = await thread(a.token, igId);
  check(
    igThread.messages.filter((m) => m.role === "customer").length === 2 &&
      igThread.messages.filter((m) => m.role === "assistant").length === 2,
    "Provider replay preserves one inbound/outbound pair per message",
  );
  check(
    igThread.conversation.workspace_id === workspace &&
      igThread.conversation.created_by === null,
    "Signed provider account maps to A despite forged payload workspace fields",
  );
  const bad = {
    ...signed(igAccount, sender, "Private forged text"),
    signature: "sha256=" + "0".repeat(64),
  };
  check(
    (await webhook(bad)).statusCode === 403,
    "Invalid signature is rejected before event persistence",
  );
  await app.processChannelWork();
  check(
    sends.length === beforeReplay.sends,
    "Rejected webhook cannot trigger provider outbound",
  );
  await webhook(signed("17841400000999999", sender, "Unknown account"));
  await app.processChannelWork();
  check(
    sends.length === beforeReplay.sends,
    "Unknown account cannot select a tenant",
  );
  const igHandoff = signed(igAccount, sender, "I want to speak with a person.");
  await webhook(igHandoff);
  await app.processChannelWork();
  const afterHandoff = {
    sends: sends.length,
    model: modelCalls,
    emails: emails.length,
  };
  check(
    (await thread(a.token, igId)).conversation.ai_mode === "paused",
    "Instagram hard handoff pauses the shared AI state",
  );
  await webhook(signed(igAccount, sender, "Are you there?"));
  await app.processChannelWork();
  check(
    sends.length === afterHandoff.sends &&
      modelCalls === afterHandoff.model &&
      emails.length === afterHandoff.emails,
    "Paused Instagram follow-up emits no further AI send or duplicate email",
  );
  check(
    (await team(member.token, igId, "action", { action: "claim" }))
      .statusCode === 200,
    "Inbox member claims an Instagram thread",
  );
  const igHuman = {
    clientMessageId: randomUUID(),
    content: "Hi, this is Susan from Northstar Studio.",
  };
  const igReply = await team(member.token, igId, "reply", igHuman);
  check(
    igReply.statusCode === 200 &&
      igReply.json().delivery.status === "sent" &&
      sends.length === afterHandoff.sends + 1,
    "Human Instagram reply calls transport exactly once",
  );
  await team(member.token, igId, "reply", igHuman);
  check(
    sends.length === afterHandoff.sends + 1,
    "Repeated human send request reuses the delivery record",
  );
  check(
    sends.at(-1)?.accessToken === "fictional-instagram-provider-token" &&
      !igReply.body.includes("fictional-instagram-provider-token"),
    "Vault credential reaches the server transport and never the web response",
  );
  instagramState = "unknown";
  const ambiguous = {
    clientMessageId: randomUUID(),
    content: "We can discuss your project scope.",
  };
  const unknown = await team(member.token, igId, "reply", ambiguous);
  const sendsUnknown = sends.length;
  check(
    unknown.json().delivery.status === "unknown",
    "Ambiguous Instagram outcome is shown as unknown",
  );
  await team(member.token, igId, "reply", ambiguous);
  await app.processChannelWork();
  check(
    sends.length === sendsUnknown,
    "Unknown provider outcome is never blindly resent",
  );
  instagramState = "sent";
  const oldSender = "987654999";
  await webhook(
    signed(
      igAccount,
      oldSender,
      "I'm interested in your logo design.",
      undefined,
      Date.now() - 25 * 3600000,
    ),
  );
  await app.processChannelWork();
  check(
    sends.length === sendsUnknown,
    "Messages outside 24 hours cannot produce a provider send",
  );
  const old = await a.client
    .from("conversations")
    .select("id")
    .eq("workspace_id", workspace)
    .eq("external_customer_ref", oldSender)
    .single();
  if (old.error) throw new Error("Old-window fixture unavailable");
  check(
    (await thread(a.token, old.data.id)).deliveries.some(
      (d) => d.status === "blocked" && d.error_code === "REPLY_WINDOW_CLOSED",
    ),
    "Expired provider window is visible to the team",
  );
  check(
    (
      await a.client
        .from("channel_connections")
        .select("*")
        .eq("workspace_id", workspace)
    ).data?.every(
      (c) => !JSON.stringify(c).includes("fictional-instagram-provider-token"),
    ),
    "Channel metadata exposes no provider token",
  );
  const deniedVault = await a.client
    .schema("vault" as "public")
    .from("decrypted_secrets" as "workspaces")
    .select("*");
  check(
    Boolean(deniedVault.error),
    "Browser-role client cannot access decrypted Vault secrets",
  );
  const wrongProvision = await admin.rpc("provision_instagram_channel", {
    target_workspace_id: foreign,
    expected_workspace_name: "Other Fictional Studio",
    provider_account_id: igAccount,
    provider_username: "northstar_fictional",
    provider_token: "fictional-instagram-provider-token",
    provider_version: "v26.0",
    verified_app_id: "123456789",
  });
  check(
    Boolean(wrongProvision.error),
    "Same provider account cannot silently move to a different workspace",
  );
  const unconfiguredSession = await session();
  failModel = true;
  const failed = await visitor(
    unconfiguredSession.credential,
    "I'm interested in your logo design.",
  );
  failModel = false;
  check(
    failed.response.statusCode === 503,
    "Failed model turn reports a bounded error",
  );
  const failedVisitor = await websiteThread(unconfiguredSession.credential);
  check(
    failedVisitor.needsHuman &&
      failedVisitor.messages.some((m) => m.role === "customer"),
    "Failed model leaves customer evidence durable and the conversation paused",
  );
  const r = await visitor(
    unconfiguredSession.credential,
    failed.input.content,
    failed.input.clientMessageId,
  );
  check(
    r.response.statusCode === 409 && r.response.json().code === "TURN_FAILED",
    "Failed replay does not blindly re-invoke the model",
  );
  check(
    Number(localSql("select count(*) from auth.users")) === authCountBefore + 3,
    "External visitors and Instagram senders create no fake Auth users",
  );
  const disconnected = await a.client.rpc("disconnect_instagram_channel", {
    target_workspace_id: workspace,
  });
  check(
    !disconnected.error,
    "Owner disconnect removes the stored Instagram credential",
  );
  const beforeDisconnect = sends.length;
  await webhook(signed(igAccount, sender, "A later message"));
  await app.processChannelWork();
  check(
    sends.length === beforeDisconnect,
    "Disconnected provider account cannot produce new outbound work",
  );
  localSql(
    `update public.workspace_members set active=false where workspace_id='${workspace}' and user_id='${member.id}'`,
  );
  check(
    (await team(member.token, id, "action", { action: "claim" })).statusCode ===
      403,
    "Fresh membership checks deny a revoked member despite a previously valid token",
  );
  console.info(
    `Channels acceptance passed: ${assertions} assertions; real Auth/RLS/PostgreSQL/API, ${modelCalls} fake model turns and ${embeddingCalls} fake embeddings. No live provider calls.`,
  );
} finally {
  await app.close();
}
