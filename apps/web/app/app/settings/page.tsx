import { productContext } from "@/lib/product-data";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { BusinessForm } from "@/components/product-forms";
export default async function Page() {
  const ctx = await productContext();
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your business profile and account."
      />
      <div className="form-layout">
        <div className="stack">
          <Panel
            title="Your business"
            description="How your business appears in this workspace."
          >
            <BusinessForm
              name={ctx.workspace.name}
              editable={ctx.role === "owner"}
            />
          </Panel>
          <Panel title="Your account">
            <dl className="detail-dl">
              <div>
                <dt>Email address</dt>
                <dd>{ctx.user.email}</dd>
              </div>
              <div>
                <dt>Workspace role</dt>
                <dd>
                  <Badge tone="accent">
                    {ctx.role === "owner" ? "Owner" : "Team member"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
        <p className="small muted">
          Only active members can access this workspace. Business settings and
          agent configuration are managed by its owner.
        </p>
      </div>
    </>
  );
}
