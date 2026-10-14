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
export type KnowledgeItem = {
  id: string;
  workspace_id: string;
  type: "text" | "faq";
  title: string;
  content: string;
  status: "draft" | "published" | "archived";
  revision: number;
  embedding: string | null;
  created_at: string;
  updated_at: string;
};
export type Conversation = {
  id: string;
  workspace_id: string;
  channel: "test_agent";
  status: "open" | "needs_human";
  ai_mode: "active" | "paused";
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type Message = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  role: "customer" | "assistant";
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
  source: "test_agent";
  created_at: string;
  updated_at: string;
};
export type AgentRun = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  actor_id: string;
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
export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; created_at: string }>;
      workspaces: Table<Workspace>;
      workspace_members: Table<Member>;
      agent_settings: Table<SettingsRow>;
      knowledge_items: Table<KnowledgeItem>;
      conversations: Table<Conversation>;
      messages: Table<Message>;
      leads: Table<Lead>;
      agent_runs: Table<AgentRun>;
    };
    Views: Record<never, never>;
    Functions: {
      create_workspace: RPC<{ business_name: string }, string>;
      rename_workspace: RPC<
        { target_workspace_id: string; business_name: string },
        undefined
      >;
      save_agent_settings: RPC<
        { target_workspace_id: string; settings: Json },
        undefined
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
