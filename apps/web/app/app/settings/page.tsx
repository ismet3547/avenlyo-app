import { Building2, LockKeyhole } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { BusinessForm } from "@/components/business-form";
import { dateLabel } from "@/lib/utils";
export default async function SettingsPage() {
  const ctx = await requireWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="The home for your business"
        description="Manage the essentials for this workspace."
      />
      <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="p-6 sm:p-7">
          <div className="mb-7 flex items-center gap-3">
            <Building2 className="size-5 text-primary" aria-hidden />
            <h2 className="section-title">Business information</h2>
          </div>
          <BusinessForm
            name={ctx.workspace.name}
            editable={ctx.role === "owner"}
          />
          {ctx.role !== "owner" && (
            <p className="mt-4 text-xs text-muted-foreground">
              Only workspace owners can update the business name.
            </p>
          )}
          <dl className="mt-8 space-y-5 border-t border-border pt-6 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Your role</dt>
              <dd className="capitalize">{ctx.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{dateLabel(ctx.workspace.created_at)}</dd>
            </div>
          </dl>
          <details className="mt-6 border-t border-border pt-4">
            <summary className="text-xs text-muted-foreground">
              Technical details
            </summary>
            <dl className="mt-4 text-[11px]">
              <dt className="text-muted-foreground">Workspace ID</dt>
              <dd className="mt-2 break-all font-mono">{ctx.workspace.id}</dd>
            </dl>
          </details>
        </Card>
        <div className="rounded-xl border border-border p-5">
          <LockKeyhole className="size-5 text-primary" aria-hidden />
          <h2 className="mt-4 text-sm font-medium">A workspace of its own.</h2>
          <p className="mt-2 text-xs leading-7 text-muted-foreground">
            This business has its own settings, knowledge and conversations.
            Switching workspaces changes which business you are working in.
          </p>
        </div>
      </div>
    </>
  );
}
