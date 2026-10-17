import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import type { InboxThread } from "@avenlyo-app/shared";
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
  return (
    <>
      <Link
        href="/app/inbox"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-primary"
      >
        ← All customer conversations
      </Link>
      <InboxConversation
        key={id}
        initial={result.data as InboxThread}
        actorId={ctx.user.id}
      />
    </>
  );
}
