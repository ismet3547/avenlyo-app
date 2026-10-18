import { notFound } from "next/navigation";
import { z } from "zod";
import type { InboxThread } from "@avenlyo-app/shared";
import { PageHeader, Notice } from "@/components/ui";
import { InboxView } from "@/components/conversations";
import { productContext, readInbox } from "@/lib/product-data";
import { callApi } from "@/lib/api";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const ctx = await productContext();
  const [items, result, lead] = await Promise.all([
    readInbox(),
    callApi(`/v1/inbox/${id}/thread`, { workspaceId: ctx.workspace.id }),
    ctx.supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("conversation_id", id)
      .maybeSingle(),
  ]);
  if (result.status === 403 || result.status === 404) notFound();
  return (
    <>
      <PageHeader
        title="The whole conversation."
        description="Context, clarity and a thoughtful next step."
      />
      {result.status === 200 ? (
        <div className="stack">
          <InboxView
            key={id}
            items={items}
            initialThread={result.data as InboxThread}
            userId={ctx.user.id}
            contact={lead.error ? null : lead.data}
          />
          {lead.error && (
            <Notice error>
              Customer contact details are temporarily unavailable.
            </Notice>
          )}
        </div>
      ) : (
        <Notice error>
          This conversation could not be loaded. Please refresh to try again.
        </Notice>
      )}
    </>
  );
}
