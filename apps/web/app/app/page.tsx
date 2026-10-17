import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  MessageSquare,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
export default async function Overview() {
  const { supabase, workspace } = await requireWorkspace();
  const [knowledge, conversations, qualified, human, agent, channels] = await Promise.all(
    [
      supabase
        .from("knowledge_items")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("status", "published"),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("qualification", "qualified"),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("status", "needs_human"),
      supabase
        .from("agent_settings")
        .select("setup_brief,updated_at")
        .eq("workspace_id", workspace.id)
        .single(),
      supabase.from("channel_connections").select("id", {count: "exact", head: true}).eq("workspace_id", workspace.id).eq("enabled", true),
    ],
  );
  const published = knowledge.error ? null : (knowledge.count ?? 0);
  const configured = Boolean(
    agent.data &&
      (agent.data.setup_brief.trim() ||
        new Date(agent.data.updated_at) > new Date(workspace.created_at)),
  );
  return (
    <>
      <PageHeader
        eyebrow={workspace.name}
        title="Your AI front office"
        description="A place for better answers, useful inquiries, and a clear view of every conversation."
        action={
          <Button asChild>
            <Link href="/app/test-agent">
              <Sparkles aria-hidden />
              Test agent
            </Link>
          </Button>
        }
      />
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-[#efeffd] text-primary">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <Badge
              className={
                configured
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : ""
              }
            >
              {configured ? "Configured" : "Needs setup"}
            </Badge>
          </div>
          <h2 className="mt-5 font-semibold">Your agent</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Set its goals, tone and the details that make an inquiry useful.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary"
            href="/app/agent"
          >
            Configure agent
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-[#eff7f2] text-emerald-700">
              <BookOpen className="size-4" aria-hidden />
            </span>
            <Badge>
              {published === null ? "Unavailable" : `${published} published`}
            </Badge>
          </div>
          <h2 className="mt-5 font-semibold">Business knowledge</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add services and FAQs. Your agent uses only what you publish.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary"
            href="/app/knowledge/new"
          >
            Add knowledge
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
              <MessageSquare className="size-4" aria-hidden />
            </span>
            <Badge>{channels.error ? "Unavailable" : `${channels.count ?? 0} enabled`}</Badge>
          </div>
          <h2 className="mt-5 font-semibold">Customer channels</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Website Chat and managed Instagram conversations, with your team in Inbox.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary"
            href="/app/channels"
          >
            View channels
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </Card>
      </section>
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Workspace activity</h2>
          <Badge>All channels · includes tests</Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Conversations",
              value: conversations.error ? "—" : (conversations.count ?? 0),
              icon: MessageSquare,
            },
            {
              title: "Qualified leads",
              value: qualified.error ? "—" : (qualified.count ?? 0),
              icon: UsersRound,
            },
            {
              title: "Needs human",
              value: human.error ? "—" : (human.count ?? 0),
              icon: UsersRound,
            },
          ].map(({ title, value, icon: Icon }) => (
            <Card key={title} className="p-5">
              <p className="flex items-center justify-between text-sm text-muted-foreground">
                {title}
                <Icon aria-hidden className="size-4" />
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {value}
              </p>
            </Card>
          ))}
        </div>
      </section>
      <Card className="mt-8 flex flex-wrap items-center justify-between gap-5 bg-[#f0f0fc] p-6">
        <div>
          <h2 className="font-semibold">
            A useful first conversation starts with good knowledge.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No website required. Add a service description and a FAQ, then try a
            customer question.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-primary">
            <Check className="size-3.5" aria-hidden />
            Published knowledge stays under your control.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/app/knowledge/new">
            Add your first item
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Card>
    </>
  );
}
