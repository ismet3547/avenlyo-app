import { z } from "zod";

export const goals = [
  "answer_questions",
  "identify_interest",
  "qualify_inquiries",
  "collect_contact",
  "human_handoff",
] as const;
export const contactFields = ["name", "email", "phone", "company"] as const;
export const agentSettingsSchema = z
  .object({
    tone: z.enum(["professional", "warm", "concise"]),
    goals: z.array(z.enum(goals)).min(1).max(5),
    contact_fields: z.array(z.enum(contactFields)).max(4),
    human_handoff_enabled: z.literal(true),
    setup_brief: z.string().trim().max(1500),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (!s.goals.includes("human_handoff"))
      ctx.addIssue({
        code: "custom",
        message: "Human assistance must remain available.",
      });
    if (
      new Set(s.goals).size !== s.goals.length ||
      new Set(s.contact_fields).size !== s.contact_fields.length
    )
      ctx.addIssue({ code: "custom", message: "Selections must be unique." });
    if (s.contact_fields.length && !s.goals.includes("collect_contact"))
      ctx.addIssue({
        code: "custom",
        message: "Enable contact collection before requiring contact details.",
      });
  });
export type AgentSettings = z.infer<typeof agentSettingsSchema>;
export type RuntimeSettings = Omit<AgentSettings, "setup_brief">;
export const defaultSettings: AgentSettings = {
  tone: "professional",
  goals: [...goals],
  contact_fields: ["name", "email"],
  human_handoff_enabled: true,
  setup_brief: "",
};
export function runtimeSettings(settings: AgentSettings): RuntimeSettings {
  const { tone, goals, contact_fields, human_handoff_enabled } = settings;
  return { tone, goals, contact_fields, human_handoff_enabled };
}

export const workspaceSchema = z
  .object({ name: z.string().trim().min(2).max(100) })
  .strict();
export const knowledgeSchema = z
  .object({
    type: z.enum(["text", "faq"]),
    title: z.string().trim().min(3).max(180),
    content: z.string().trim().min(3).max(6000),
  })
  .strict();
export const turnSchema = z
  .object({
    workspaceId: z.uuid(),
    conversationId: z.uuid().nullable(),
    idempotencyKey: z.uuid(),
    content: z.string().trim().min(1).max(2000),
  })
  .strict();
export const modelResponseSchema = z
  .object({
    reply: z.string().trim().min(1).max(2500),
    request_human: z.boolean(),
    interest: z.enum(["service", "general", "declined"]),
    name: z.string().trim().min(1).max(120).nullable(),
    email: z.email().max(254).nullable(),
    phone: z.string().trim().min(7).max(40).nullable(),
    company: z.string().trim().min(1).max(120).nullable(),
  })
  .strict();
export type ModelResponse = z.infer<typeof modelResponseSchema>;
export type LeadCandidate = {
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  intent: "service_inquiry";
  qualification: "needs_info" | "qualified" | "needs_human";
  summary: string;
};
export type TurnResult = {
  conversationId: string;
  reply: string;
  leadId: string | null;
  needsHuman: boolean;
  sources: { id: string; title: string }[];
  replayed: boolean;
};
