export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Workspace = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  onboarding_completed_at: string | null;
  first_channel_activated_at: string | null;
};
export type Member = {
  workspace_id: string;
  user_id: string;
  role: "owner" | "member";
  active: boolean;
  created_at: string;
};
export type SettingsRow = {
  workspace_id: string;
  tone: "professional" | "warm" | "concise";
  goals: string[];
  contact_fields: string[];
  human_handoff_enabled: boolean;
  setup_brief: string;
  updated_at: string;
};
export type Agent = SettingsRow & {
  id: string;
  name: string;
  is_default: boolean;
  primary_language: string;
  additional_languages: string[];
  language_policy: "configured" | "legacy_multilingual";
  knowledge_mode: "all" | "selected";
  created_at: string;
  archived_at: string | null;
};
export type AgentKnowledgeItem = {
  workspace_id: string;
  agent_id: string;
  knowledge_item_id: string;
};
export type KnowledgeItem = {
  id: string;
  workspace_id: string;
  type: import("./schemas.ts").KnowledgeType | "text";
  price_statement: string;
  currency: string;
  details: string;
  collection_id: string | null;
  runtime_content: string;
  title: string;
  content: string;
  status: "draft" | "published" | "archived";
  revision: number;
  embedding: string | null;
  created_at: string;
  updated_at: string;
};
export type KnowledgeCollection = {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};
export type Conversation = {
  id: string;
  workspace_id: string;
  channel: "test_agent" | "website_chat" | "instagram";
  status: "open" | "needs_human";
  ai_mode: "active" | "paused";
  created_by: string | null;
  channel_connection_id: string | null;
  external_customer_ref: string | null;
  assignee_id: string | null;
  handoff_state: "none" | "requested" | "claimed";
  handoff_at: string | null;
  claimed_at: string | null;
  last_customer_at: string | null;
  state_version: number;
  created_at: string;
  updated_at: string;
};
export type Message = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  role: "customer" | "assistant" | "human";
  human_actor_id: string | null;
  client_message_id: string | null;
  content: string;
  sources: Json;
  created_at: string;
};
export type Lead = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  intent: string;
  qualification: "needs_info" | "qualified" | "needs_human";
  summary: string;
  status: "new";
  source: "test_agent" | "website_chat" | "instagram";
  created_at: string;
  updated_at: string;
};
export type AgentRun = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  actor_id: string | null;
  website_session_id: string | null;
  channel_event_id: string | null;
  state_version: number | null;
  idempotency_key: string;
  customer_content: string;
  status: "processing" | "completed" | "failed";
  response: Json | null;
  created_at: string;
  updated_at: string;
};
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
type RPC<Args, Returns> = { Args: Args; Returns: Returns };
export type ChannelConnection = {
  id: string;
  public_id: string;
  workspace_id: string;
  channel: "website_chat" | "instagram";
  enabled: boolean;
  status: "ready" | "connected" | "needs_attention" | "disconnected";
  approved_origins: string[];
  provider_account_id: string | null;
  provider_username: string | null;
  api_version: string | null;
  verified_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};
export type DeliveryState =
  | "pending"
  | "sending"
  | "available"
  | "sent"
  | "failed"
  | "unknown"
  | "blocked";
export type MessageDelivery = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  connection_id: string;
  message_id: string;
  status: DeliveryState;
  provider_message_id: string | null;
  error_code: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
};
export type NotificationRecord = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  kind: "qualified_lead" | "human_assistance";
  status: "pending" | "sending" | "sent" | "failed" | "unknown" | "suppressed";
  recipient_user_id: string | null;
  error_code: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
};
export type InboxItem = {
  id: string;
  channel: "website_chat" | "instagram";
  customerRef: string;
  aiMode: "active" | "paused";
  handoffState: "none" | "requested" | "claimed";
  assigneeId: string | null;
  updatedAt: string;
  preview: string | null;
  leadId: string | null;
  qualification: Lead["qualification"] | null;
  needsAttention: boolean;
};
export type InboxThread = {
  conversation: Conversation;
  messages: Message[];
  lead: Pick<Lead, "id" | "name" | "qualification"> | null;
  deliveries: MessageDelivery[];
  notifications: Pick<
    NotificationRecord,
    "id" | "kind" | "status" | "error_code"
  >[];
  hasEarlier: boolean;
};
export type StartedChannelTurn = {
  run_id: string;
  conversation_id: string;
  workspace_id: string;
  state: "processing" | "completed" | "failed";
  existing: boolean;
  response: Json | null;
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; created_at: string }>;
      workspaces: Table<Workspace>;
      workspace_members: Table<Member>;
      agent_settings: Table<SettingsRow>;
      agents: Table<Agent>;
      agent_knowledge_items: Table<AgentKnowledgeItem>;
      knowledge_items: Table<KnowledgeItem>;
      knowledge_collections: Table<KnowledgeCollection>;
      conversations: Table<Conversation>;
      messages: Table<Message>;
      leads: Table<Lead>;
      agent_runs: Table<AgentRun>;
      channel_connections: Table<ChannelConnection>;
      website_sessions: Table<{
        id: string;
        workspace_id: string;
        connection_id: string;
        conversation_id: string;
        origin: string;
        expires_at: string;
        created_at: string;
      }>;
      channel_events: Table<{
        id: string;
        workspace_id: string;
        connection_id: string;
        provider_message_id: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>;
      message_deliveries: Table<MessageDelivery>;
      business_notifications: Table<NotificationRecord>;
    };
    Views: Record<never, never>;
    Functions: {
      sync_onboarding: RPC<{ target_workspace_id: string }, Json>;
      complete_onboarding_without_channel: RPC<
        { target_workspace_id: string },
        string
      >;
      home_snapshot: RPC<{ target_workspace_id: string }, Json>;
      configure_website_channel: RPC<
        {
          target_workspace_id: string;
          channel_enabled: boolean;
          origins: string[];
        },
        string
      >;
      disconnect_instagram_channel: RPC<
        { target_workspace_id: string },
        undefined
      >;
      website_origin_allowed: RPC<
        { public_channel_id: string; request_origin: string },
        boolean
      >;
      create_website_session: RPC<
        {
          public_channel_id: string;
          request_origin: string;
          credential_hash: string;
        },
        Json
      >;
      read_website_thread: RPC<
        {
          public_channel_id: string;
          request_origin: string;
          credential_hash: string;
          before_message_id?: string | null;
        },
        Json
      >;
      begin_website_turn: RPC<
        {
          public_channel_id: string;
          request_origin: string;
          credential_hash: string;
          client_message_id: string;
          customer_content: string;
        },
        StartedChannelTurn[]
      >;
      accept_instagram_event: RPC<
        {
          provider_account_id: string;
          sender_id: string;
          provider_message_id: string;
          customer_content: string;
          payload_hash: string;
          provider_timestamp: string;
        },
        Json
      >;
      claim_instagram_event: RPC<Record<never, never>, StartedChannelTurn[]>;
      channel_runtime_context: RPC<{ target_run_id: string }, Json>;
      match_channel_knowledge: RPC<
        { target_run_id: string; query_embedding: string },
        {
          id: string;
          title: string;
          content: string;
          revision: number;
          similarity: number;
        }[]
      >;
      finish_channel_turn: RPC<
        {
          target_run_id: string;
          assistant_content: string;
          source_references: Json;
          request_human: boolean;
          lead_payload: Json | null;
        },
        Json
      >;
      fail_channel_turn: RPC<{ target_run_id: string }, undefined>;
      conversation_team_action: RPC<
        {
          target_workspace_id: string;
          target_conversation_id: string;
          team_action: string;
        },
        undefined
      >;
      create_human_reply: RPC<
        {
          target_workspace_id: string;
          target_conversation_id: string;
          client_message_id: string;
          reply_content: string;
        },
        string
      >;
      inbox_snapshot: RPC<
        { target_workspace_id: string; page_offset?: number },
        Json
      >;
      claim_message_delivery: RPC<{ target_message_id?: string | null }, Json>;
      finish_message_delivery: RPC<
        {
          target_delivery_id: string;
          delivery_state: string;
          provider_message_id: string | null;
          failure_code: string | null;
        },
        undefined
      >;
      claim_business_notification: RPC<
        { target_conversation_id?: string | null },
        Json
      >;
      finish_business_notification: RPC<
        {
          target_notification_id: string;
          notification_state: string;
          failure_code: string | null;
        },
        undefined
      >;
      inspect_instagram_target: RPC<{ target_workspace_id: string }, Json>;
      provision_instagram_channel: RPC<
        {
          target_workspace_id: string;
          expected_workspace_name: string;
          provider_account_id: string;
          provider_username: string;
          provider_token: string;
          provider_version: string;
          verified_app_id: string;
        },
        string
      >;
      create_workspace: RPC<{ business_name: string }, string>;
      rename_workspace: RPC<
        { target_workspace_id: string; business_name: string },
        undefined
      >;
      create_agent: RPC<
        {
          target_workspace_id: string;
          agent_name: string;
          role_brief: string;
          primary_code: string;
        },
        string
      >;
      save_agent: RPC<
        {
          target_workspace_id: string;
          target_agent_id: string;
          agent_name: string;
          settings: Json;
        },
        undefined
      >;
      set_agent_languages: RPC<
        {
          target_workspace_id: string;
          target_agent_id: string;
          primary_code: string;
          additional_codes: string[];
        },
        undefined
      >;
      set_agent_knowledge_scope: RPC<
        {
          target_workspace_id: string;
          target_agent_id: string;
          scope_mode: string;
          item_ids: string[];
        },
        undefined
      >;
      archive_agent: RPC<
        { target_workspace_id: string; target_agent_id: string },
        undefined
      >;
      save_agent_settings: RPC<
        { target_workspace_id: string; settings: Json },
        undefined
      >;
      save_knowledge_collection: RPC<
        {
          target_workspace_id: string;
          target_collection_id: string | null;
          collection_name: string;
        },
        string
      >;
      save_business_knowledge: RPC<
        {
          target_workspace_id: string;
          target_item_id: string | null;
          item_type: string;
          item_title: string;
          item_content: string;
          expected_revision: number | null;
          item_price_statement: string;
          item_currency: string;
          item_details: string;
          item_collection_id: string | null;
        },
        string
      >;
      save_knowledge_item: RPC<
        {
          target_workspace_id: string;
          target_item_id: string | null;
          item_type: string;
          item_title: string;
          item_content: string;
          expected_revision: number | null;
        },
        string
      >;
      change_knowledge_status: RPC<
        {
          target_workspace_id: string;
          target_item_id: string;
          target_status: string;
        },
        undefined
      >;
      delete_knowledge_item: RPC<
        { target_workspace_id: string; target_item_id: string },
        undefined
      >;
      match_agent_knowledge: RPC<
        {
          target_workspace_id: string;
          target_agent_id: string;
          query_embedding: string;
          match_limit?: number;
        },
        {
          id: string;
          title: string;
          content: string;
          revision: number;
          similarity: number;
        }[]
      >;
      match_knowledge: RPC<
        {
          target_workspace_id: string;
          query_embedding: string;
          match_limit: number;
        },
        {
          id: string;
          title: string;
          content: string;
          revision: number;
          similarity: number;
        }[]
      >;
      publish_knowledge_item: RPC<
        {
          actor_id: string;
          target_workspace_id: string;
          target_item_id: string;
          expected_revision: number;
          item_embedding: string;
        },
        undefined
      >;
      begin_agent_turn: RPC<
        {
          actor_id: string;
          target_workspace_id: string;
          target_conversation_id: string | null;
          target_idempotency_key: string;
          customer_content: string;
        },
        {
          run_id: string;
          conversation_id: string;
          state: "processing" | "completed" | "failed";
          existing: boolean;
          response: Json | null;
        }[]
      >;
      finish_agent_turn: RPC<
        {
          actor_id: string;
          target_run_id: string;
          assistant_content: string;
          source_references: Json;
          request_human: boolean;
          lead_payload: Json | null;
        },
        Json
      >;
      fail_agent_turn: RPC<
        { actor_id: string; target_run_id: string },
        undefined
      >;
      resume_test_conversation: RPC<
        { target_workspace_id: string; target_conversation_id: string },
        undefined
      >;
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
