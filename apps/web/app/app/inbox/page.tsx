import { PageHeader } from "@/components/ui";
import { InboxView } from "@/components/conversations";
import { productContext, readInbox } from "@/lib/product-data";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.min(
    2000,
    Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0),
  );
  const [ctx, items] = await Promise.all([
    productContext(),
    readInbox(page * 50),
  ]);
  return (
    <>
      <PageHeader
        title="Inbox"
        description="Manage customer conversations and reply with your team."
      />
      <InboxView
        items={items}
        userId={ctx.user.id}
        nextPage={
          items.length === 50 ? `/app/inbox?page=${page + 1}` : undefined
        }
        previousPage={page > 0 ? `/app/inbox?page=${page - 1}` : undefined}
      />
    </>
  );
}
