import { notFound } from "next/navigation";
import { z } from "zod";
import type { InboxThread, InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { callApi } from "@/lib/api";
import { InboxConversation } from "@/components/inbox-conversation";
export default async function InboxDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireWorkspace();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const result = await callApi(`/v1/inbox/${id}/thread`, {
    workspaceId: ctx.workspace.id,
  });
  if (result.status === 403) notFound();
  if (result.status !== 200)
    throw new Error("Conversation could not be loaded");
  const [list, contact] = await Promise.all([
    ctx.supabase.rpc("inbox_snapshot", {
      target_workspace_id: ctx.workspace.id,
      page_offset: 0,
    }),
    ctx.supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("conversation_id", id)
      .maybeSingle(),
  ]);
  const items = list.error
    ? []
    : ((list.data as unknown as InboxItem[] | null) ?? []);
  return (
    <>
      <InboxConversation
        key={id}
        initial={result.data as InboxThread}
        actorId={ctx.user.id}
        contact={contact.data}
        related={items}
      />
    </>
  );
}
