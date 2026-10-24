import type {
  Conversation,
  KnowledgeItem,
  Lead,
  Message,
  SettingsRow,
  ChannelConnection,
  MessageDelivery,
  Workspace,
} from "@avenlyo-app/shared";
export const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const ids = {
  actor: uuid(1),
  workspace: uuid(2),
  second: uuid(3),
  test: uuid(4),
  inbox: uuid(5),
  knowledge: uuid(6),
  lead: uuid(7),
  instagram: uuid(8),
  longTest: uuid(9),
};
const created = "2026-10-20T12:00:00.000Z";
export function fixture() {
  const workspaces: Workspace[] = [ids.workspace, ids.second].map((id, i) => ({
    id,
    name: i ? "Second Workspace" : "Northstar Studio",
    slug: `studio-${i}`,
    created_at: created,
  }));
  const settings: SettingsRow[] = workspaces.map((w) => ({
    workspace_id: w.id,
    goals: [
      "answer_questions",
      "identify_interest",
      "qualify_inquiries",
      "collect_contact",
      "human_handoff",
    ],
    tone: w.id === ids.workspace ? "professional" : "warm",
    contact_fields: ["name", "email"],
    human_handoff_enabled: true,
    setup_brief: w.id === ids.workspace ? "" : "Second workspace note",
    updated_at: created,
  }));
  const knowledge: KnowledgeItem[] = Array.from({ length: 23 }, (_, i) => ({
    id: i ? uuid(100 + i) : ids.knowledge,
    workspace_id: ids.workspace,
    type: i % 2 ? "faq" : "text",
    title: i
      ? `Business knowledge ${String(i).padStart(2, "0")}`
      : "Logo design services",
    content:
      "We design logos and websites for small businesses. " +
      (i ? "Ask about project scope." : "longword".repeat(45)),
    status: i % 3 ? "draft" : "published",
    revision: 1,
    embedding: null,
    created_at: created,
    updated_at: created,
  }));
  function conversation(
    id: string,
    channel: Conversation["channel"],
  ): Conversation {
    return {
      id,
      workspace_id: ids.workspace,
      channel,
      status: channel === "test_agent" ? "open" : "needs_human",
      ai_mode: channel === "test_agent" ? "active" : "paused",
      created_by: channel === "test_agent" ? ids.actor : null,
      channel_connection_id: null,
      external_customer_ref: "visitor-123",
      assignee_id: null,
      handoff_state: channel === "test_agent" ? "none" : "requested",
      handoff_at: null,
      claimed_at: null,
      last_customer_at: created,
      state_version: 1,
      created_at: created,
      updated_at: created,
    };
  }
  const conversations = [
    conversation(ids.test, "test_agent"),
    conversation(ids.inbox, "website_chat"),
    conversation(ids.instagram, "instagram"),
    conversation(ids.longTest, "test_agent"),
  ];
  function message(
    id: string,
    conversation_id: string,
    content: string,
    minute = 0,
  ): Message {
    return {
      id,
      workspace_id: ids.workspace,
      conversation_id,
      content,
      role: "customer",
      human_actor_id: null,
      client_message_id: null,
      sources: [],
      created_at: new Date(Date.parse(created) + minute * 60000).toISOString(),
    };
  }
  const messages = [
    message(uuid(200), ids.test, "Tell me about your services."),
    message(uuid(201), ids.inbox, "I need a person. " + "longword".repeat(50)),
    message(uuid(202), ids.instagram, "Please help with my project."),
    ...Array.from({ length: 120 }, (_, i) =>
      message(uuid(1000 + i), ids.longTest, `Saved message ${i + 1}`, i),
    ),
  ];
  const leads: Lead[] = Array.from({ length: 23 }, (_, i) => ({
    id: i ? uuid(300 + i) : ids.lead,
    workspace_id: ids.workspace,
    conversation_id: i ? uuid(600 + i) : ids.inbox,
    name: i ? `Customer ${i}` : "Alex",
    email: i ? `customer${i}@example.test` : "alex@example.test",
    phone: null,
    company: null,
    intent: "service_inquiry",
    qualification: i % 3 ? "qualified" : "needs_info",
    summary: "Customer asked about a design project. " + "longword".repeat(45),
    status: "new",
    source: i ? "test_agent" : "website_chat",
    created_at: created,
    updated_at: created,
  }));
  for (let i = 1; i < leads.length; i++)
    conversations.push(conversation(uuid(600 + i), "test_agent"));
  const channels: ChannelConnection[] = [
    {
      id: uuid(400),
      public_id: uuid(401),
      workspace_id: ids.workspace,
      channel: "website_chat",
      enabled: true,
      status: "ready",
      approved_origins: ["http://localhost:3001"],
      provider_account_id: null,
      provider_username: null,
      api_version: null,
      verified_at: null,
      last_activity_at: null,
      created_at: created,
      updated_at: created,
    },
    {
      id: uuid(402),
      public_id: uuid(403),
      workspace_id: ids.workspace,
      channel: "instagram",
      enabled: false,
      status: "needs_attention",
      approved_origins: [],
      provider_account_id: "fictional-account",
      provider_username: "fictional_studio",
      api_version: null,
      verified_at: created,
      last_activity_at: null,
      created_at: created,
      updated_at: created,
    },
  ];
  return {
    workspaces,
    settings,
    knowledge,
    conversations,
    messages,
    leads,
    channels,
    deliveries: [] as MessageDelivery[],
    mutations: [] as {
      operation: string;
      workspaceId: string;
      content?: string;
    }[],
    controls: {
      role: "owner",
      failNextResume: false,
      failNextThread: false,
      failNextSave: false,
    },
    replies: new Map<string, string>(),
    turns: new Map<string, unknown>(),
  };
}
