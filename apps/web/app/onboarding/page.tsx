import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { z } from "zod";
import { agentSettingsSchema, websiteOriginSchema } from "@avenlyo-app/shared";
import { productContext } from "@/lib/product-data";
import { onboardingState } from "@/lib/onboarding";
import { activeSetupStep } from "@/lib/onboarding-model";
import {
  SetupAccordion,
  SetupAgent,
  SetupKnowledge,
  SetupTest,
  SetupChannel,
} from "@/components/onboarding";
import { EmbedSnippet } from "@/components/product-forms";
import { Notice } from "@/components/ui";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; item?: string }>;
}) {
  const [ctx, state, params] = await Promise.all([
    productContext(),
    onboardingState(),
    searchParams,
  ]);
  if (state.completedAt)
    return (
      <div className="setup-complete">
        <span className="setup-ready-icon">
          <Check aria-hidden="true" />
        </span>
        <h1>Your front office is ready.</h1>
        <p>Avenlyo can now start handling customer conversations.</p>
        <Link className="button button-primary" href="/app">
          Go to Home <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    );
  const active = activeSetupStep(state, params.step);
  const editable = ctx.role === "owner";
  let content;
  if (active === 0) {
    const settings = await ctx.supabase
      .from("agent_settings")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .single();
    if (settings.error) throw new Error("Agent settings could not be loaded.");
    content = (
      <SetupAgent
        settings={agentSettingsSchema.parse({
          tone: settings.data.tone,
          goals: settings.data.goals,
          contact_fields: settings.data.contact_fields,
          human_handoff_enabled: settings.data.human_handoff_enabled,
          setup_brief: settings.data.setup_brief,
        })}
        editable={editable}
      />
    );
  } else if (active === 1) {
    const itemId = z.uuid().safeParse(params.item);
    const [items, item] = await Promise.all([
      ctx.supabase
        .from("knowledge_items")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .neq("status", "archived")
        .order("updated_at", { ascending: false })
        .limit(5),
      itemId.success
        ? ctx.supabase
            .from("knowledge_items")
            .select("*")
            .eq("workspace_id", ctx.workspace.id)
            .eq("id", itemId.data)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (items.error || item.error)
      throw new Error("Knowledge could not be loaded.");
    content = (
      <SetupKnowledge
        key={
          item.data
            ? `${item.data.id}-${item.data.revision}-${item.data.status}`
            : "new"
        }
        item={item.data ?? undefined}
        items={items.data}
        editable={editable}
        published={state.published}
      />
    );
  } else if (active === 2)
    content = (
      <SetupTest workspaceId={ctx.workspace.id} tested={state.tested} />
    );
  else {
    const channels = await ctx.supabase
      .from("channel_connections")
      .select("*")
      .eq("workspace_id", ctx.workspace.id);
    if (channels.error) throw new Error("Channels could not be loaded.");
    const website = channels.data.find((c) => c.channel === "website_chat");
    const instagram = channels.data.find((c) => c.channel === "instagram");
    const publicUrl = websiteOriginSchema.parse(
      process.env.AVENLYO_PUBLIC_API_URL ?? "http://localhost:4001",
    );
    content = (
      <SetupChannel
        website={website}
        editable={editable}
        instagramConnected={Boolean(
          instagram?.enabled &&
            instagram.status === "connected" &&
            instagram.verified_at,
        )}
        snippet={
          website ? (
            <EmbedSnippet
              code={`<script src="${publicUrl}/widget.js" data-avenlyo-channel="${website.public_id}" defer></script>`}
            />
          ) : (
            <p className="setup-help">
              Your installation snippet will appear after activation. You can
              also find it in Channels.
            </p>
          )
        }
      />
    );
  }
  return (
    <>
      {!editable && (
        <Notice>
          Your workspace owner needs to complete agent, knowledge and channel
          setup. You can test the agent when it’s ready.{" "}
          <Link className="text-link" href="/workspaces">
            Choose another workspace
          </Link>
        </Notice>
      )}
      <SetupAccordion state={state} active={active}>
        {content}
      </SetupAccordion>
    </>
  );
}
