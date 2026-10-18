import type { InboxItem } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { InboxWorkspace } from "@/components/inbox-workspace";
import { inboxPage } from "@/lib/inbox";
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireWorkspace();
  const page = inboxPage((await searchParams).page);
  const result = await ctx.supabase.rpc("inbox_snapshot", {
    target_workspace_id: ctx.workspace.id,
    page_offset: page * 50,
  });
  return (
    <InboxWorkspace
      key={page}
      items={(result.data as unknown as InboxItem[] | null) ?? []}
      actorId={ctx.user.id}
      page={page}
      failed={Boolean(result.error)}
    />
  );
}
