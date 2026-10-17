import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
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
    <div className="max-w-[1120px]">
      <PageHeader
        title="Leads"
        description="Useful customer inquiries, with the context to follow up."
      />
      <nav
        className="mb-1 flex flex-wrap border-b border-border"
        aria-label="Lead qualification filters"
      >
        {[
          ["all", "All"],
          ["qualified", "Qualified"],
          ["needs_info", "Needs info"],
          ["needs_human", "Needs human"],
        ].map(([key, label]) => (
          <Link
            key={key}
            className="filter-tab"
            aria-current={qualification === key ? "page" : undefined}
            href={`/app/leads${key === "all" ? "" : `?qualification=${key}`}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {result.error ? (
        <p role="alert" className="py-6">
          Leads could not be loaded.
        </p>
      ) : !result.data.length ? (
        <EmptyState
          title="Qualified inquiries will appear here."
          description="When someone shows genuine service interest and provides contact details, the inquiry stays linked to their conversation. Try the experience with your agent."
          action={
            <Button asChild>
              <Link href="/app/test-agent">Test your agent</Link>
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border border-b border-border">
          {result.data.map((lead) => (
            <Link
              key={lead.id}
              href={`/app/leads/${lead.id}`}
              className="group grid gap-4 py-6 transition-colors hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-start sm:gap-6"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold group-hover:text-primary">
                  {lead.name ?? lead.company ?? "Service inquiry"}
                </p>
                <p className="mt-1 break-words text-[13px] text-muted-foreground">
                  {lead.email ?? lead.phone ?? "Contact details in progress"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] leading-6">
                  {lead.summary}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <ChannelLabel channel={lead.source} />
                  <time
                    dateTime={lead.updated_at}
                    className="text-xs tabular-nums text-muted-foreground"
                  >
                    {dateLabel(lead.updated_at)}
                  </time>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Qualification value={lead.qualification} />
                <ArrowUpRight
                  aria-hidden
                  className="size-3.5 text-muted-foreground"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        Contact details are customer-stated. Test Agent inquiries are labeled
        separately from customer channels.
      </p>
    </div>
  );
}
