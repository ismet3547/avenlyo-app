import Link from "next/link";
import { ArrowUpRight, FlaskConical, UsersRound } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dateLabel } from "@/lib/utils";
import { channelLabels } from "@avenlyo-app/shared";
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ qualification?: string; view?: string }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const tests = params.view === "tests";
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
  query = tests
    ? query.eq("source", "test_agent")
    : query.in("source", ["website_chat", "instagram"]);
  if (qualification !== "all")
    query = query.eq(
      "qualification",
      qualification as "needs_info" | "qualified" | "needs_human",
    );
  const result = await query;
  function href(value: string, testView = tests) {
    const p = new URLSearchParams();
    if (value !== "all") p.set("qualification", value);
    if (testView) p.set("view", "tests");
    return `/app/leads${p.size ? `?${p}` : ""}`;
  }
  return (
    <>
      <PageHeader
        eyebrow="Customer interest"
        title="Turn interest into a next step"
        description="Useful inquiries from your conversations, with the details your customers shared."
        action={
          <div className="inline-flex rounded-lg border border-border bg-white p-1">
            <Link
              href={href(qualification ?? "all", false)}
              aria-current={!tests ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-xs ${!tests ? "bg-muted font-semibold text-primary" : "text-muted-foreground"}`}
            >
              Customers
            </Link>
            <Link
              href={href(qualification ?? "all", true)}
              aria-current={tests ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs ${tests ? "bg-muted font-semibold text-primary" : "text-muted-foreground"}`}
            >
              <FlaskConical className="size-3" aria-hidden />
              Test data
            </Link>
          </div>
        }
      />
      {tests && (
        <p className="form-message mb-5 border border-border bg-white text-muted-foreground">
          You are viewing Test Agent inquiries. These are practice records; no
          customer message or team notification is sent.
        </p>
      )}
      <nav className="filter-bar" aria-label="Lead qualification filters">
        {[
          ["all", "All leads"],
          ["qualified", "Qualified"],
          ["needs_info", "Needs info"],
          ["needs_human", "Needs human"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={href(key)}
            aria-current={qualification === key ? "page" : undefined}
            className="filter-tab"
          >
            {label}
          </Link>
        ))}
      </nav>
      {result.error ? (
        <p role="alert" className="form-message bg-red-50 text-red-700">
          Leads could not be loaded. Refresh to try again.
        </p>
      ) : !result.data.length ? (
        <EmptyState
          title={
            tests
              ? "See what a useful test inquiry looks like"
              : "The right details. A clearer follow-up."
          }
          description={
            tests
              ? "Try a service inquiry in Test Agent and provide the requested contact details. Greetings and ordinary FAQs do not create leads."
              : "When customers show interest, your agent gathers relevant details. Their inquiries will appear here with a link to the conversation."
          }
          action={
            <Button variant="outline" asChild>
              <Link href={tests ? "/app/test-agent" : "/app/inbox"}>
                {tests ? "Test your agent" : "Open Inbox"}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {result.data.length} {tests ? "test" : "customer"} inquir
              {result.data.length === 1 ? "y" : "ies"}
              {result.data.length === 100 ? " · 100 most recently updated" : ""}
            </span>
            <span className="hidden sm:inline">Customer-stated details</span>
          </div>
          <Card className="overflow-hidden">
            <div className="lead-row hidden !py-3 text-[11px] text-muted-foreground md:grid">
              <span>Contact</span>
              <span>Inquiry</span>
              <span>Qualification</span>
              <span>Updated</span>
            </div>
            {result.data.map((lead) => (
              <Link
                key={lead.id}
                href={`/app/leads/${lead.id}`}
                className="lead-row group"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-muted text-xs text-primary">
                    {lead.name ? (
                      lead.name.slice(0, 2).toUpperCase()
                    ) : (
                      <UsersRound className="size-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">
                      {lead.name ?? lead.company ?? "Service inquiry"}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {lead.email ??
                        lead.phone ??
                        "Contact details in progress"}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 min-w-0 md:col-span-1">
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {lead.summary || "Service inquiry"}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {channelLabels[lead.source]}
                  </p>
                </div>
                <div className="col-start-2 row-start-1 md:col-auto md:row-auto">
                  <Badge
                    className={
                      lead.qualification === "qualified"
                        ? "status-success"
                        : lead.qualification === "needs_human"
                          ? "status-warning"
                          : ""
                    }
                  >
                    <span className="status-dot" />
                    {lead.qualification === "qualified"
                      ? "Qualified"
                      : lead.qualification === "needs_human"
                        ? "Needs human"
                        : "Needs info"}
                  </Badge>
                </div>
                <div className="col-span-2 flex items-center justify-between md:col-span-1">
                  <time
                    dateTime={lead.updated_at}
                    className="text-[11px] text-muted-foreground"
                  >
                    {dateLabel(lead.updated_at)}
                  </time>
                  <ArrowUpRight
                    className="size-3.5 text-primary opacity-0 group-hover:opacity-100"
                    aria-hidden
                  />
                </div>
              </Link>
            ))}
          </Card>
        </>
      )}
      <p className="mt-6 text-xs leading-6 text-muted-foreground">
        Each inquiry stays linked to its original conversation. Contact details
        are customer-stated and do not verify identity.
      </p>
    </>
  );
}
