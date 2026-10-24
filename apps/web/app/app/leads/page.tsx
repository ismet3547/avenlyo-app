import { QueryError } from "@/components/query-error";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dateLabel } from "@/lib/utils";
import { Pagination, PAGE_SIZE, pageNumber } from "@/components/pagination";
import { channelLabels } from "@avenlyo-app/shared";
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    qualification?: string;
    source?: string;
    page?: string;
  }>;
}) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const source =
    params.source && Object.hasOwn(channelLabels, params.source)
      ? (params.source as keyof typeof channelLabels)
      : "all";
  const qualification = ["needs_info", "qualified", "needs_human"].includes(
    params.qualification ?? "",
  )
    ? params.qualification
    : "all";
  let query = ctx.supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("workspace_id", ctx.workspace.id)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (qualification !== "all")
    query = query.eq(
      "qualification",
      qualification as "needs_info" | "qualified" | "needs_human",
    );
  if (source !== "all") query = query.eq("source", source);
  const result = await query;
  return (
    <>
      <PageHeader
        eyebrow="Useful inquiries"
        title="Leads"
        description="Service interest with customer-stated contact details. Every inquiry keeps its original channel source."
        action={<Badge>Customer-stated details</Badge>}
      />
      <nav
        aria-label="Lead qualification filters"
        className="mb-4 flex flex-wrap gap-2"
      >
        {[
          ["all", "All leads"],
          ["qualified", "Qualified"],
          ["needs_info", "Needs info"],
          ["needs_human", "Needs human"],
        ].map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={qualification === key ? "default" : "ghost"}
            asChild
          >
            <Link
              aria-current={qualification === key ? "page" : undefined}
              href={`/app/leads?${new URLSearchParams({ ...(key === "all" ? {} : { qualification: key }), ...(source === "all" ? {} : { source }) })}`}
            >
              {label}
            </Link>
          </Button>
        ))}
      </nav>
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <input type="hidden" name="qualification" value={qualification} />
        <label className="text-sm font-medium">
          Source channel
          <select
            name="source"
            defaultValue={source}
            className="mt-2 block h-11 rounded-lg border border-border bg-white px-3"
          >
            <option value="all">All channels</option>
            {Object.entries(channelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="outline">
          Apply filter
        </Button>
        {(source !== "all" || qualification !== "all") && (
          <Link
            href="/app/leads"
            className="py-3 text-sm text-primary underline"
          >
            Clear filters
          </Link>
        )}
      </form>
      {result.error ? (
        <QueryError message="Leads could not be loaded. Try again to check the latest inquiries." />
      ) : !result.data.length ? (
        <EmptyState
          title={
            qualification !== "all" || source !== "all" || page
              ? "No leads match these filters"
              : "Useful inquiries will appear here"
          }
          description={
            qualification !== "all" || source !== "all" || page
              ? "Try another qualification or channel, or return to all leads."
              : "Try a service inquiry in Test Agent, then provide the requested contact details. Greetings and ordinary FAQs are not leads."
          }
          action={
            <Button asChild>
              <Link
                href={
                  qualification !== "all" || source !== "all" || page
                    ? "/app/leads"
                    : "/app/test-agent"
                }
              >
                {qualification !== "all" || source !== "all" || page
                  ? "View all leads"
                  : "Test your agent"}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {result.data.map((lead) => (
              <Link
                key={lead.id}
                href={`/app/leads/${lead.id}`}
                className="block rounded-xl border border-border bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">
                    {lead.name ?? lead.company ?? "Service inquiry"}
                  </h2>
                  <Badge>
                    {lead.qualification === "qualified"
                      ? "Qualified"
                      : lead.qualification === "needs_human"
                        ? "Needs human"
                        : "Needs info"}
                  </Badge>
                </div>
                <p className="mt-2 break-words text-sm text-muted-foreground">
                  {lead.email ?? lead.phone ?? "Contact details in progress"}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {lead.summary}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {channelLabels[lead.source]} · {dateLabel(lead.updated_at)}
                </p>
                <span className="mt-3 inline-block text-xs font-medium text-primary">
                  View inquiry →
                </span>
              </Link>
            ))}
          </div>
          <Card className="hidden overflow-x-auto sm:block">
            <table
              aria-label="Customer leads"
              className="w-full text-left text-sm"
            >
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-4 font-medium">
                    Contact
                  </th>
                  <th scope="col" className="px-4 py-4 font-medium">
                    Source
                  </th>
                  <th scope="col" className="px-4 py-4 font-medium">
                    Qualification
                  </th>
                  <th scope="col" className="px-4 py-4 font-medium">
                    Updated
                  </th>
                  <th scope="col" className="px-4 py-4 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/40">
                    <td className="px-4 py-4">
                      <Link
                        href={`/app/leads/${lead.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {lead.name ?? lead.company ?? "Service inquiry"}
                      </Link>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {lead.email ??
                          lead.phone ??
                          "Contact details in progress"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {channelLabels[lead.source]}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        className={
                          lead.qualification === "qualified"
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : lead.qualification === "needs_human"
                              ? "border-amber-100 bg-amber-50 text-amber-800"
                              : ""
                        }
                      >
                        {lead.qualification === "qualified"
                          ? "Qualified"
                          : lead.qualification === "needs_human"
                            ? "Needs human"
                            : "Needs info"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {dateLabel(lead.updated_at)}
                    </td>
                    <td className="px-5 py-4 text-xs">New</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
      {!result.error && (
        <Pagination
          pathname="/app/leads"
          page={page}
          total={result.count ?? 0}
          filters={{ qualification, source }}
        />
      )}
    </>
  );
}
