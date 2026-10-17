import Link from "next/link";
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
        description="Service interest with customer-stated contact details. Every inquiry keeps its original channel source."
        action={<Badge>Customer-stated details</Badge>}
      />
      <div className="mb-6 flex flex-wrap gap-2">
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
          title="Useful inquiries will appear here"
          description="Try a service inquiry in Test Agent, then provide the requested contact details. Greetings and ordinary FAQs are not leads."
          action={
            <Button asChild>
              <Link href="/app/test-agent">Test your agent</Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-medium">Contact</th>
                <th className="px-5 py-4 font-medium">Source</th>
                <th className="px-5 py-4 font-medium">Qualification</th>
                <th className="px-5 py-4 font-medium">Updated</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/40">
                  <td className="px-5 py-4">
                    <Link
                      href={`/app/leads/${lead.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {lead.name ?? lead.company ?? "Service inquiry"}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lead.email ??
                        lead.phone ??
                        "Contact details in progress"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {channelLabels[lead.source]}
                  </td>
                  <td className="px-5 py-4">
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
      )}
    </>
  );
}
