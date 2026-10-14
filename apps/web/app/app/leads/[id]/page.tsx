import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { channelLabels } from "@avenlyo-app/shared";
export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireWorkspace();
  const { id } = await params;
  const result = await ctx.supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .single();
  if (result.error) notFound();
  const lead = result.data;
  return (
    <>
      <Link
        href="/app/leads"
        className="mb-5 inline-block text-xs text-muted-foreground hover:text-primary"
      >
        ← All leads
      </Link>
      <PageHeader
        title={lead.name ?? lead.company ?? "Service inquiry"}
        description={`Customer-stated details from ${channelLabels[lead.source]}.`}
        action={
          <Button asChild variant="outline">
            <Link href={lead.source === "test_agent" ? `/app/conversations/${lead.conversation_id}` : `/app/inbox/${lead.conversation_id}`}>
              View conversation
              <ArrowUpRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Inquiry summary</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {lead.summary}
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-5 border-t border-border pt-6">
            <div>
              <dt className="text-xs text-muted-foreground">Intent</dt>
              <dd className="mt-2 text-sm font-medium">Service inquiry</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Qualification</dt>
              <dd className="mt-2">
                <Badge>
                  {lead.qualification === "qualified"
                    ? "Qualified"
                    : lead.qualification === "needs_human"
                      ? "Needs human"
                      : "Needs info"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Source</dt>
              <dd className="mt-2 text-sm font-medium">{channelLabels[lead.source]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-2 text-sm font-medium">New</dd>
            </div>
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Contact details</h2>
          <dl className="mt-5 space-y-5">
            {[
              ["Name", lead.name],
              ["Email", lead.email],
              ["Phone", lead.phone],
              ["Company", lead.company],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1.5 break-words text-sm font-medium">
                  {value ?? "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            These details are customer-stated and are not verified identity. Review the linked conversation before following up.
          </p>
        </Card>
      </div>
    </>
  );
}
