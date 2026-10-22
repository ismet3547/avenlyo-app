import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { channelLabels } from "@avenlyo-app/shared";
import { productContext } from "@/lib/product-data";
import { ActionLink, Badge, PageHeader, Panel } from "@/components/ui";
import { dateLabel, qualificationLabel } from "@/lib/presentation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const ctx = await productContext();
  const result = await ctx.supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .maybeSingle();
  if (result.error) throw new Error("Lead could not be loaded.");
  if (!result.data) notFound();
  const lead = result.data;
  return (
    <>
      <Link
        href="/app/leads"
        className="text-link"
        style={{ marginBottom: 22 }}
      >
        <ArrowLeft aria-hidden="true" />
        Back to leads
      </Link>
      <PageHeader
        title={lead.name || lead.company || "A new opportunity."}
        description={`Captured via ${channelLabels[lead.source]} · ${dateLabel(lead.created_at, true)} UTC`}
        action={
          <ActionLink
            href={
              lead.source === "test_agent"
                ? `/app/conversations/${lead.conversation_id}`
                : `/app/inbox/${lead.conversation_id}`
            }
          >
            Open conversation
            <ArrowUpRight aria-hidden="true" />
          </ActionLink>
        }
      />
      <div className="detail-grid">
        <Panel title="What they’re looking for">
          <div className="detail-content">{lead.summary}</div>
          <div className="panel-body">
            <Badge
              tone={
                lead.qualification === "qualified"
                  ? "success"
                  : lead.qualification === "needs_human"
                    ? "warning"
                    : "neutral"
              }
            >
              {qualificationLabel[lead.qualification]}
            </Badge>
            {lead.source === "test_agent" && (
              <span style={{ marginLeft: 8 }}>
                <Badge tone="accent">Test lead</Badge>
              </span>
            )}
          </div>
        </Panel>
        <Panel title="Customer details">
          <dl className="detail-dl">
            {[
              ["Name", lead.name],
              ["Email", lead.email],
              ["Phone", lead.phone],
              ["Company", lead.company],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "Not shared yet"}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}
