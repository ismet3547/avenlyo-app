import { PageHeader } from "@/components/ui";
import { LeadsList } from "@/components/leads-list";
import { productContext } from "@/lib/product-data";
export default async function Page() {
  const ctx = await productContext();
  const leads = await ctx.supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .neq("source", "test_agent")
    .order("updated_at", { ascending: false });
  if (leads.error) throw new Error("Leads could not be loaded.");
  return (
    <>
      <PageHeader
        title="Leads"
        description="Customer inquiries and contact details captured by your agent."
      />
      <LeadsList leads={leads.data} />
    </>
  );
}
