import { z } from "zod";
export const configSchema = z.object({
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  API_CORS_ORIGIN: z.url().default("http://localhost:3001"),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_AGENT_MODEL: z.string().default("gpt-5.4-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  PUBLIC_APP_URL: z.url().default("http://localhost:3001"),
  INSTAGRAM_APP_SECRET: z.string().min(16).optional(),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string().min(20).max(200).optional(),
  INSTAGRAM_META_APP_ID: z
    .string()
    .regex(/^\d{3,32}$/)
    .optional(),
  INSTAGRAM_API_VERSION: z.literal("v26.0").default("v26.0"),
  INSTAGRAM_WEBHOOK_URL: z.url().optional(),
  BUSINESS_NOTIFICATION_PROVIDER: z
    .enum(["disabled", "resend"])
    .default("disabled"),
  RESEND_API_KEY: z.string().min(1).optional(),
  BUSINESS_NOTIFICATION_FROM: z.string().min(3).max(200).optional(),
});
export type Config = z.infer<typeof configSchema>;
