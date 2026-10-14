import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
export default function InboxPage() {
  return (
    <>
      <PageHeader
        title="A place for your team"
        description="Human assistance remains part of Avenlyo. The shared customer inbox arrives with real channel support."
      />
      <EmptyState
        title="Customer inbox is coming next"
        description="No external channels are connected yet. Review saved test conversations and human assistance requests in Conversations."
        action={
          <Button variant="outline" asChild>
            <Link href="/app/conversations">View test conversations</Link>
          </Button>
        }
      />
    </>
  );
}
