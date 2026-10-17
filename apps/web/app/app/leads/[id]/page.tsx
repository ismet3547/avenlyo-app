import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Qualification } from "@/components/conversation-item";
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
    <div className="max-w-[1120px]">
      <Link
        href="/app/leads"
        className="mb-6 inline-block text-xs text-muted-foreground hover:text-primary"
      >
        ← All leads
      </Link>
      <PageHeader
        title={lead.name ?? lead.company ?? "Service inquiry"}
        description="A customer inquiry, with the details to continue the conversation."
        action={
          <Button asChild>
            <Link
              href={
                lead.source === "test_agent"
                  ? `/app/conversations/${lead.conversation_id}`
                  : `/app/inbox/${lead.conversation_id}`
              }
            >
              Open conversation
              <ArrowUpRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="grid items-start gap-8 border-t border-border pt-7 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        <section className="lg:border-r lg:border-border lg:pr-8">
          <h2 className="eyebrow">Contact</h2>
          <dl className="mt-4 space-y-4">
            {[
              ["Name", lead.name],
              ["Email", lead.email],
              ["Phone", lead.phone],
              ["Company", lead.company],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium">
                  {value ?? "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs leading-6 text-muted-foreground">
            Customer-stated details. Review the conversation before following
            up.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold">Inquiry</h2>
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7">
            {lead.summary}
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6">
            <div>
              <dt className="text-xs text-muted-foreground">Intent</dt>
              <dd className="mt-2 text-[13px] font-medium">
                {lead.intent === "service_inquiry"
                  ? "Service inquiry"
                  : lead.intent}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Qualification</dt>
              <dd className="mt-2">
                <Qualification value={lead.qualification} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Source</dt>
              <dd className="mt-2 text-[13px] font-medium">
                {channelLabels[lead.source]}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
