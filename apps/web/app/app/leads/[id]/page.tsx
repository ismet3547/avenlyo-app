import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dateLabel } from "@/lib/utils";
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
  const test = lead.source === "test_agent";
  return (
    <>
      <Link
        href={`/app/leads${test ? "?view=tests" : ""}`}
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All {test ? "test " : ""}leads
      </Link>
      <PageHeader
        eyebrow={test ? "Test inquiry" : "Customer inquiry"}
        title={lead.name ?? lead.company ?? "Service inquiry"}
        description={`Shared through ${channelLabels[lead.source]} · Updated ${dateLabel(lead.updated_at)}`}
        action={
          <Button asChild>
            <Link
              href={
                test
                  ? `/app/conversations/${lead.conversation_id}`
                  : `/app/inbox/${lead.conversation_id}`
              }
            >
              View conversation
              <ArrowUpRight aria-hidden />
            </Link>
          </Button>
        }
      />
      {test && (
        <p className="form-message mb-5 border border-border bg-white text-muted-foreground">
          Test data · This inquiry came from a practice conversation.
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <Card className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="section-title">The conversation so far</h2>
            <Badge
              className={
                lead.qualification === "qualified"
                  ? "status-success"
                  : lead.qualification === "needs_human"
                    ? "status-warning"
                    : ""
              }
            >
              {lead.qualification === "qualified"
                ? "Qualified"
                : lead.qualification === "needs_human"
                  ? "Needs human"
                  : "Needs info"}
            </Badge>
          </div>
          <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-8 text-muted-foreground">
            {lead.summary ||
              "No summary is available yet. Review the linked conversation for context."}
          </p>
          <div className="mt-8 rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium">A useful place to pick up.</p>
            <p className="mt-1.5 text-xs leading-6 text-muted-foreground">
              Read the original conversation before following up. The summary
              and details reflect what the customer shared.
            </p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-border pt-6 text-xs">
            <div>
              <dt className="text-muted-foreground">Source</dt>
              <dd className="mt-2 font-medium">{channelLabels[lead.source]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="mt-2 font-medium">{dateLabel(lead.created_at)}</dd>
            </div>
          </dl>
        </Card>
        <Card className="p-6 sm:p-7">
          <h2 className="section-title">Contact details</h2>
          <dl className="mt-6 space-y-6">
            {[
              { label: "Name", value: lead.name, icon: UserRound },
              { label: "Email", value: lead.email, icon: Mail },
              { label: "Phone", value: lead.phone, icon: Phone },
              { label: "Company", value: lead.company, icon: Building2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex gap-3">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div className="min-w-0">
                  <dt className="text-[11px] text-muted-foreground">{label}</dt>
                  <dd
                    className={`mt-1.5 break-words text-[13px] ${value ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {value ?? "Not provided"}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-7 border-t border-border pt-4 text-[11px] leading-6 text-muted-foreground">
            Customer-stated details · identity has not been verified.
          </p>
        </Card>
      </div>
    </>
  );
}
