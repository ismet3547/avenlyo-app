import { notFound } from "next/navigation";
import { z } from "zod";
import type { InboxItem, InboxThread } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { callApi } from "@/lib/api";
import { InboxWorkspace } from "@/components/inbox-workspace";
import { InboxConversation } from "@/components/inbox-conversation";
import { inboxPage } from "@/lib/inbox";
export default async function InboxDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireWorkspace();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const page = inboxPage((await searchParams).page);
  const [result, queue] = await Promise.all([
    callApi(`/v1/inbox/${id}/thread`, { workspaceId: ctx.workspace.id }),
    ctx.supabase.rpc("inbox_snapshot", {
      target_workspace_id: ctx.workspace.id,
      page_offset: page * 50,
    }),
  ]);
  if (result.status === 403 || result.status === 404) notFound();
  if (result.status !== 200)
    throw new Error("Conversation could not be loaded");
  return (
    <InboxWorkspace
      items={(queue.data as unknown as InboxItem[] | null) ?? []}
      selectedId={id}
      actorId={ctx.user.id}
      page={page}
      failed={Boolean(queue.error)}
    >
      <InboxConversation
        key={id}
        initial={result.data as InboxThread}
        actorId={ctx.user.id}
        page={page}
      />
    </InboxWorkspace>
  );
}
