import { Globe, MessageCircle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export default function ChannelsPage() {
  return (
    <>
      <PageHeader
        title="Meet customers where they are"
        description="Your business knowledge and agent settings will power future customer channels. Test the foundation today."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {[
          {
            name: "Website Chat",
            icon: Globe,
            description:
              "A helpful front office on your website. Customer conversations, inquiries, and handoff in one place.",
          },
          {
            name: "Instagram",
            icon: MessageCircle,
            description:
              "Answer customer-initiated direct messages using the same business knowledge and agent settings.",
          },
        ].map(({ name, icon: Icon, description }) => (
          <Card className="p-6" key={name}>
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl border border-border bg-muted">
                <Icon className="size-5" aria-hidden />
              </span>
              <Badge>Coming next</Badge>
            </div>
            <h2 className="mt-6 text-lg font-semibold tracking-tight">
              {name}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              Not connected. External customer messaging is not available in
              this milestone.
            </p>
          </Card>
        ))}
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-white p-5">
        <p className="text-sm text-muted-foreground">
          Start with a test conversation to check your agent’s answers.
        </p>
        <Button asChild variant="outline">
          <Link href="/app/test-agent">Test agent</Link>
        </Button>
      </div>
    </>
  );
}
