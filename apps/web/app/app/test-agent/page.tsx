import Link from "next/link";
import { Plus } from "lucide-react";
import { z } from "zod";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { TestChat } from "@/components/test-chat";
import { Button } from "@/components/ui/button";
import { ResumeTest } from "@/components/resume-test";
export default async function TestAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const id = z.uuid().safeParse(params.conversation);
  if (params.conversation && !id.success) notFound();
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
  if (conversationId && !authorizedId) {
    if (conversation?.error?.code === "PGRST116") notFound();
    throw new Error("The saved test could not be loaded");
  }
  const messages = authorizedId
    ? await ctx.supabase
        .from("messages")
        .select("role,content")
        .eq("workspace_id", ctx.workspace.id)
        .eq("conversation_id", authorizedId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
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
  if (messages?.error || lead?.error) throw new Error("The saved test could not be loaded");
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
        <ResumeTest workspaceId={ctx.workspace.id} conversationId={authorizedId!} />
      )}
      <TestChat
        key={`${ctx.workspace.id}:${authorizedId ?? "new"}`}
        workspaceId={ctx.workspace.id}
        conversationId={authorizedId}
        initialMessages={messages?.data ? [...messages.data].reverse().map(m => ({role: m.role === "customer" ? "customer" : "assistant", content: m.content})) : []}
        initialLeadId={lead?.data?.id ?? null}
        paused={conversation?.data?.ai_mode === "paused"}
        partialHistory={messages?.data?.length === 100}
      />
    </>
  );
}
