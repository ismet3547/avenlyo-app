import type {
  ChannelConnection,
  InboxItem,
  InboxThread,
  KnowledgeCollection,
  KnowledgeItem,
  Lead,
  Message,
} from "@avenlyo-app/shared";
export const workspaceId = "00000000-0000-4000-8000-000000000001";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const now = "2026-10-18T14:15:00Z";
export const collections: KnowledgeCollection[] = [
  {
    id: uuid(80),
    workspace_id: workspaceId,
    name: "Our business",
    created_at: now,
    updated_at: now,
  },
  {
    id: uuid(81),
    workspace_id: workspaceId,
    name: "Getting started",
    created_at: now,
    updated_at: now,
  },
];
export const knowledge: KnowledgeItem[] = [
  [
    "Brand strategy & visual identity",
    "service",
    "published",
    "We help ambitious businesses build thoughtful brands. Our work includes positioning, visual identity and a clear set of brand guidelines.",
  ],
  [
    "How our projects work",
    "faq",
    "published",
    "Every project starts with a discovery call. We agree on a clear scope and timeline before beginning any work.",
  ],
  [
    "Studio hours & contact details",
    "business_info",
    "published",
    "Our team is available Monday to Friday, 9am–6pm. Get in touch at hello@example.com.",
  ],
  [
    "Website design packages",
    "pricing",
    "published",
    "Our website packages are scoped to your goals. We provide a detailed proposal after the discovery call.",
  ],
  [
    "Project changes & cancellation",
    "policy",
    "published",
    "Changes to scope are agreed in writing. Contact our team to discuss your project and any timeline adjustments.",
  ],
  [
    "What makes a great project brief?",
    "custom_note",
    "draft",
    "Tell us about your business, who you want to reach and what success looks like. Include a realistic timeline and budget.",
  ],
  [
    "Previous service offering",
    "service",
    "archived",
    "An archived service, retained for reference.",
  ],
].map(([title, type, status, content], i) => ({
  id: uuid(100 + i),
  workspace_id: workspaceId,
  type: type as KnowledgeItem["type"],
  title,
  content,
  status: status as KnowledgeItem["status"],
  revision: 1,
  embedding: null,
  runtime_content: content,
  price_statement: type === "pricing" ? "Custom proposals from $2,500" : "",
  currency: type === "pricing" ? "USD" : "",
  details: "",
  collection_id: collections[i % 2].id,
  created_at: now,
  updated_at: now,
}));
export const leads: Lead[] = [
  [
    "Emma Wilson",
    "emma@example.com",
    "Willow & Co.",
    "Brand identity for a new wellness studio.",
    "qualified",
    "website_chat",
  ],
  [
    "Oliver Chen",
    "oliver@example.com",
    "Forma",
    "A new website for an independent architecture practice.",
    "needs_info",
    "website_chat",
  ],
  [
    "Sofia Martinez",
    "sofia@example.com",
    "Studio Sol",
    "Would like to discuss a brand strategy project with the team.",
    "needs_human",
    "instagram",
  ],
  [
    "James Parker",
    "james@example.com",
    "Parker Goods",
    "Exploring visual identity and packaging for a new product line.",
    "qualified",
    "website_chat",
  ],
  [
    "Lily Thompson",
    "lily@example.com",
    "Bloom",
    "Asking about the project process and typical timelines.",
    "needs_info",
    "website_chat",
  ],
].map(([name, email, company, summary, qualification, source], i) => ({
  id: uuid(200 + i),
  conversation_id: uuid(300 + i),
  workspace_id: workspaceId,
  name,
  email,
  company,
  summary,
  qualification: qualification as Lead["qualification"],
  source: source as Lead["source"],
  phone: null,
  intent: "service_inquiry",
  status: "new",
  created_at: now,
  updated_at: now,
}));
export const items: InboxItem[] = leads.map((lead, i) => ({
  id: lead.conversation_id,
  customerRef: lead.name!,
  channel: lead.source as InboxItem["channel"],
  aiMode: i === 2 ? "paused" : "active",
  handoffState: i === 2 ? "requested" : "none",
  assigneeId: null,
  updatedAt: now,
  preview: [
    "That sounds perfect. What would the next step be?",
    "Do you also work on smaller website projects?",
    "Could I speak with someone about a project?",
    "Thanks! I’ll take a look at your portfolio.",
    "How long does a typical branding project take?",
  ][i],
  leadId: lead.id,
  qualification: lead.qualification,
  needsAttention: false,
}));
export const channels: ChannelConnection[] = [
  {
    id: uuid(400),
    public_id: uuid(401),
    workspace_id: workspaceId,
    agent_id: "11111111-1111-4111-8111-111111111111",
    channel: "website_chat",
    enabled: true,
    status: "connected",
    approved_origins: ["https://example.com"],
    provider_account_id: null,
    provider_username: null,
    api_version: null,
    verified_at: now,
    last_activity_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: uuid(402),
    public_id: uuid(403),
    workspace_id: workspaceId,
    agent_id: "11111111-1111-4111-8111-111111111111",
    channel: "instagram",
    enabled: false,
    status: "disconnected",
    approved_origins: [],
    provider_account_id: null,
    provider_username: null,
    api_version: null,
    verified_at: null,
    last_activity_at: null,
    created_at: now,
    updated_at: now,
  },
];
export function threadFor(id: string): InboxThread {
  const index = Math.max(
    0,
    items.findIndex((item) => item.id === id),
  );
  const item = items[index];
  const messages: Message[] = [
    [
      "customer",
      "Hi! I’m opening a wellness studio and looking for some help with the branding.",
    ],
    [
      "assistant",
      "Hi there! That sounds like an exciting new chapter. We help businesses build thoughtful brands, from strategy and positioning to visual identity. What stage are you at with the studio?",
    ],
    [
      "customer",
      "We’ve found a space and are planning to open in the spring. I’d love the brand to feel calm and welcoming.",
    ],
    [
      "assistant",
      "A clear direction is a lovely place to start. We usually begin with a discovery call to understand your vision, audience and goals. From there, the team can put together a proposal that fits your project.",
    ],
    ["customer", item.preview!],
  ].map(([role, content], i) => ({
    id: uuid(500 + i),
    workspace_id: workspaceId,
    conversation_id: id,
    role: role as Message["role"],
    content,
    sources:
      role === "assistant"
        ? [{ id: knowledge[0].id, title: knowledge[0].title }]
        : [],
    human_actor_id: null,
    client_message_id: null,
    created_at: `2026-10-18T14:${String(10 + i).padStart(2, "0")}:00Z`,
  }));
  return {
    conversation: {
      agent_id: "af666666-6666-4666-8666-666666666666",
      id,
      workspace_id: workspaceId,
      channel: item.channel,
      status: index === 2 ? "needs_human" : "open",
      ai_mode: item.aiMode,
      created_by: null,
      channel_connection_id: channels[0].id,
      external_customer_ref: null,
      assignee_id: null,
      handoff_state: item.handoffState,
      handoff_at: index === 2 ? now : null,
      claimed_at: null,
      last_customer_at: now,
      state_version: 1,
      created_at: now,
      updated_at: now,
    },
    messages,
    lead: {
      id: leads[index].id,
      name: item.customerRef,
      qualification: leads[index].qualification,
    },
    deliveries: [],
    notifications: [],
    hasEarlier: false,
  };
}
