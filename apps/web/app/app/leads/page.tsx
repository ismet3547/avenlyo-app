import Link from "next/link";
import { ArrowUpRight, UsersRound } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChannelLabel, Qualification } from "@/components/conversation-item";
import { dateLabel } from "@/lib/utils";
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ qualification?: string }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const qualification = ["needs_info", "qualified", "needs_human"].includes(
    params.qualification ?? "",
  )
    ? params.qualification
    : "all";
  let query = ctx.supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (qualification !== "all")
    query = query.eq(
      "qualification",
      qualification as "needs_info" | "qualified" | "needs_human",
    );
  const result = await query;
  return (
    <>
      <PageHeader
        eyebrow="Useful inquiries"
        title="Leads"
        description="Customer interest, useful context and the contact details your team needs to follow up."
      />
      <div className="mb-5 flex flex-wrap gap-1 border-b border-border pb-3">
        {[
          ["all", "All leads"],
          ["qualified", "Qualified"],
          ["needs_info", "Needs info"],
          ["needs_human", "Needs human"],
        ].map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={qualification === key ? "outline" : "ghost"}
            asChild
          >
            <Link
              aria-current={qualification === key ? "page" : undefined}
              href={`/app/leads${key === "all" ? "" : `?qualification=${key}`}`}
            >
              {label}
            </Link>
          </Button>
        ))}
      </div>
      {result.error ? (
        <p role="alert">Leads could not be loaded.</p>
      ) : !result.data.length ? (
        <EmptyState
          title="Qualified customer inquiries will appear here."
          description="When someone shows genuine service interest and provides contact details, their inquiry stays linked to the conversation. Try the experience in Test Agent."
          action={
            <Button asChild>
              <Link href="/app/test-agent">Test your agent</Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr] gap-5 border-b border-border bg-muted/40 px-6 py-3 text-[11px] text-muted-foreground lg:grid">
            <span>Customer / contact</span>
            <span>Inquiry</span>
            <span>Qualification / source</span>
            <span>Last activity</span>
          </div>
          <div className="divide-y divide-border">
            {result.data.map((lead) => (
              <Link
                key={lead.id}
                href={`/app/leads/${lead.id}`}
                className="group grid gap-4 p-5 transition-colors hover:bg-muted/40 sm:p-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:items-center lg:gap-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-success-soft text-primary"
                  >
                    <UsersRound className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary">
                      {lead.name ?? lead.company ?? "Service inquiry"}
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                      {lead.email ??
                        lead.phone ??
                        "Contact details in progress"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium">Service inquiry</p>
                  <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-muted-foreground">
                    {lead.summary}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:block">
                  <Qualification value={lead.qualification} />
                  <div className="lg:mt-2">
                    <ChannelLabel channel={lead.source} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <time
                    dateTime={lead.updated_at}
                    className="text-xs tabular-nums text-muted-foreground"
                  >
                    {dateLabel(lead.updated_at)}
                  </time>
                  <ArrowUpRight
                    aria-hidden
                    className="size-3.5 text-muted-foreground"
                  />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        Contact details are customer-stated. Test Agent inquiries are labeled
        separately from customer channels.
      </p>
    </>
  );
}
