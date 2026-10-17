import Link from "next/link";
import { Plus } from "lucide-react";
import { z } from "zod";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { TestChat } from "@/components/test-chat";
import { Button } from "@/components/ui/button";
import { resumeTest } from "./actions";
export default async function TestAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const id = z.uuid().safeParse(params.conversation);
  const conversationId = id.success ? id.data : null;
  const conversation = conversationId
    ? await ctx.supabase
        .from("conversations")
        .select("id,ai_mode")
        .eq("workspace_id", ctx.workspace.id)
        .eq("id", conversationId)
        .eq("channel", "test_agent")
        .single()
    : null;
  const authorizedId = conversation?.data?.id ?? null;
  const messages = authorizedId
    ? await ctx.supabase
        .from("messages")
        .select("role,content")
        .eq("workspace_id", ctx.workspace.id)
        .eq("conversation_id", authorizedId)
        .order("created_at")
        .limit(100)
    : null;
  const lead = authorizedId
    ? await ctx.supabase
        .from("leads")
        .select("id")
        .eq("workspace_id", ctx.workspace.id)
        .eq("conversation_id", authorizedId)
        .maybeSingle()
    : null;
  return (
    <>
      <PageHeader
        eyebrow="Test Agent"
        title="Try a customer conversation"
        description="Test your effective settings and published knowledge. Conversations and leads are test data; no external customer message or team notification is sent."
        action={
          <Button asChild variant="outline">
            <Link href="/app/test-agent">
              <Plus aria-hidden />
              New test
            </Link>
          </Button>
        }
      />
      {conversation?.data?.ai_mode === "paused" && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-attention/20 bg-attention-soft p-4">
          <p className="text-sm text-attention">
            This test needs human assistance. Automated answers are paused.
          </p>
          <form action={resumeTest}>
            <input type="hidden" name="conversationId" value={authorizedId!} />
            <Button size="sm" variant="outline">
              Resume test AI
            </Button>
          </form>
        </div>
      )}
      <TestChat
        key={authorizedId ?? "new"}
        workspaceId={ctx.workspace.id}
        conversationId={authorizedId}
        initialMessages={
          messages?.data?.map((m) => ({
            role: m.role === "customer" ? "customer" : "assistant",
            content: m.content,
          })) ?? []
        }
        initialLeadId={lead?.data?.id ?? null}
      />
    </>
  );
}
