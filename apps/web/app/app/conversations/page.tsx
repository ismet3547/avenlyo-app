import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { productContext } from "@/lib/product-data";
import {
  ActionLink,
  Badge,
  EmptyState,
  PageHeader,
  Panel,
} from "@/components/ui";
import { dateLabel } from "@/lib/presentation";
export default async function Page() {
  const ctx = await productContext();
  const result = await ctx.supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("channel", "test_agent")
    .order("updated_at", { ascending: false });
  if (result.error) throw new Error("Test history could not be loaded.");
  return (
    <>
      <PageHeader
        eyebrow="LEARN FROM EVERY PRACTICE RUN"
        title="Your test conversations."
        description="A record of the questions you’ve tried and the answers you can improve."
        action={
          <ActionLink href="/app/test-agent">
            <Plus aria-hidden="true" />
            New test
          </ActionLink>
        }
      />
      <Panel>
        {result.data.length ? (
          <ul className="data-list">
            {result.data.map((c, i) => (
              <li key={c.id}>
                <Link
                  className="conversation-row"
                  href={`/app/conversations/${c.id}`}
                >
                  <div className="conversation-copy">
                    <div className="conversation-title">
                      <strong>
                        Test conversation {result.data.length - i}
                      </strong>
                      <Badge
                        tone={c.ai_mode === "paused" ? "warning" : "accent"}
                      >
                        {c.ai_mode === "paused"
                          ? "Human assistance"
                          : "Test mode"}
                      </Badge>
                    </div>
                    <p>{dateLabel(c.created_at, true)} UTC</p>
                  </div>
                  <ArrowUpRight className="muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Every good agent starts with a question"
            description="Try a conversation with your agent. You’ll find the history here."
            action={
              <ActionLink href="/app/test-agent">
                Start a test
                <ArrowUpRight aria-hidden="true" />
              </ActionLink>
            }
          />
        )}
      </Panel>
    </>
  );
}
