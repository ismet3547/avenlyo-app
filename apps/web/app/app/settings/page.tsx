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
        title="Workspace settings"
        description="The essentials for your business and its independent workspace."
      />
      <Card className="max-w-2xl p-6">
        <h2 className="mb-6 text-sm font-semibold">Business information</h2>
        {ctx.role !== "owner" && (
          <p className="mb-5 rounded-lg bg-muted p-3 text-sm leading-6 text-muted-foreground">
            You have member access. Only workspace owners can change business
            settings.
          </p>
        )}
        <BusinessForm
          workspaceId={ctx.workspace.id}
          name={ctx.workspace.name}
          editable={ctx.role === "owner"}
        />
        <dl className="mt-8 space-y-4 border-t border-border pt-6 text-xs">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Workspace ID</dt>
            <dd className="break-all font-mono">{ctx.workspace.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Your role</dt>
            <dd className="capitalize">{ctx.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{dateLabel(ctx.workspace.created_at)}</dd>
          </div>
        </dl>
      </Card>
    </>
  );
}
