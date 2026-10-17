"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Play, ArrowUpRight } from "lucide-react";
import type { AgentSettings } from "@avenlyo-app/shared";
import { saveAgent } from "@/app/app/agent/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
const options = [
  [
    "answer_questions",
    "Answer customer questions",
    "Use approved, published business knowledge.",
  ],
  [
    "identify_interest",
    "Identify customer interest",
    "Recognize genuine service and project inquiries.",
  ],
  [
    "qualify_inquiries",
    "Qualify inquiries",
    "Check whether the details your team needs are present.",
  ],
  [
    "collect_contact",
    "Collect contact details",
    "Ask interested customers for the fields you select.",
  ],
] as const;
export function AgentForm({
  settings,
  editable,
  published,
  channels,
}: {
  settings: AgentSettings;
  editable: boolean;
  published: number | null;
  channels: { name: string; state: string }[];
}) {
  const [state, action, pending] = useActionState(saveAgent, {
    message: "",
    status: "idle",
  } as FormState);
  const [tone, setTone] = useState(settings.tone);
  const [goals, setGoals] = useState(settings.goals);
  const [fields, setFields] = useState(settings.contact_fields);
  return (
    <div className="agent-editor-layout">
      <form action={action} className="min-w-0">
        <section className="editor-section">
          <h2>Business objective</h2>
          <label htmlFor="setup-brief" className="text-[13px]">
            What should Avenlyo help your customers with?
          </label>
          <Textarea
            id="setup-brief"
            name="setup_brief"
            className="mt-3 min-h-28"
            defaultValue={settings.setup_brief}
            maxLength={1500}
            disabled={!editable}
            placeholder="Help customers understand our services, identify useful inquiries and collect the details our team needs."
          />
          <p className="field-help mt-3">
            The structured controls below define allowed behavior. Your
            objective cannot override product policy or grant new permissions.
          </p>
        </section>
        <section className="editor-section">
          <h2>Capabilities</h2>
          <div className="divide-y divide-border">
            {options.map(([value, title, description]) => (
              <label key={value} className="capability-row">
                <input
                  name="goals"
                  value={value}
                  type="checkbox"
                  checked={goals.includes(value)}
                  disabled={!editable}
                  onChange={(e) =>
                    setGoals((current) =>
                      e.target.checked
                        ? [...current, value]
                        : current.filter((goal) => goal !== value),
                    )
                  }
                />
                <span>
                  <span className="block text-[13px] font-medium">{title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {description}
                  </span>
                </span>
              </label>
            ))}
            <label className="capability-row">
              <input type="checkbox" checked disabled />
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-[13px] font-medium">Human handoff</span>
                <span className="text-xs text-muted-foreground">
                  Always available
                </span>
              </span>
            </label>
          </div>
        </section>
        <section className="editor-section">
          <h2>Communication</h2>
          <fieldset>
            <legend className="sr-only">Tone</legend>
            <div className="tone-control">
              {(["professional", "warm", "concise"] as const).map((value) => (
                <label key={value}>
                  <input
                    className="sr-only"
                    type="radio"
                    name="tone"
                    value={value}
                    checked={tone === value}
                    onChange={() => setTone(value)}
                    disabled={!editable}
                  />
                  <span className="capitalize">{value}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="field-help mt-3">
            {tone === "professional"
              ? "Clear and considered."
              : tone === "warm"
                ? "Friendly and approachable."
                : "Direct and to the point."}
          </p>
        </section>
        <section className="editor-section">
          <h2>Contact details</h2>
          <p className="field-help mb-3">
            Ask for these details when a customer shows genuine interest.
          </p>
          <fieldset>
            <legend className="sr-only">Contact details to collect</legend>
            <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
              {(["name", "email", "phone", "company"] as const).map((field) => (
                <label
                  key={field}
                  className="flex cursor-pointer items-center gap-2.5 py-2"
                >
                  <input
                    type="checkbox"
                    name="contact_fields"
                    value={field}
                    checked={fields.includes(field)}
                    onChange={(e) =>
                      setFields((current) =>
                        e.target.checked
                          ? [...current, field]
                          : current.filter((value) => value !== field),
                      )
                    }
                    disabled={!editable}
                    className="size-4"
                  />
                  <span className="text-[13px] capitalize">{field}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
        <section className="editor-section">
          <h2>Human assistance</h2>
          <p className="text-[13px] leading-6">
            Customers can ask to speak with a person. Your team can also take
            over from Inbox.
          </p>
          <p className="field-help mt-2">
            Requests for a person and questions without enough published
            information pause AI. Claiming or replying keeps it paused until
            your team explicitly resumes it.
          </p>
        </section>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button disabled={!editable || pending} type="submit">
            {pending ? "Saving…" : "Save settings"}
          </Button>
          {state.message && (
            <p
              role="status"
              className={
                "text-sm " +
                (state.status === "error" ? "text-danger" : "text-success")
              }
            >
              {state.message}
            </p>
          )}
          {!editable && (
            <p className="text-xs text-muted-foreground">
              Only workspace owners can change settings.
            </p>
          )}
        </div>
      </form>
      <aside className="agent-summary" aria-label="Configuration preview">
        <p className="eyebrow">Your agent</p>
        <h2 className="mt-2 text-xl font-medium capitalize tracking-tight">
          {tone}
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Configuration preview. Changes take effect after you save settings.
        </p>
        <section className="mt-6">
          <h3 className="text-xs font-semibold">Can help with</h3>
          <ul className="mt-3 space-y-2.5">
            {options
              .filter(([value]) => goals.includes(value))
              .map(([value, title]) => (
                <li key={value} className="flex gap-2 text-[13px]">
                  <Check aria-hidden className="mt-0.5 size-3.5 text-primary" />
                  {title}
                </li>
              ))}
            <li className="flex gap-2 text-[13px]">
              <Check aria-hidden className="mt-0.5 size-3.5 text-primary" />
              Hand off to your team
            </li>
          </ul>
        </section>
        <section>
          <h3 className="text-xs font-semibold">Collects</h3>
          <p className="mt-2 text-[13px] capitalize">
            {fields.join(" · ") || "No contact details selected"}
          </p>
        </section>
        <section>
          <h3 className="text-xs font-semibold">Knowledge</h3>
          <Link
            href="/app/knowledge"
            className="mt-2 block text-[13px] text-primary hover:underline"
          >
            {published === null
              ? "Unavailable"
              : published +
                " published " +
                (published === 1 ? "item" : "items")}
          </Link>
        </section>
        <section>
          <h3 className="text-xs font-semibold">Channels</h3>
          <div className="mt-2 space-y-2">
            {channels.map((channel) => (
              <p
                key={channel.name}
                className="flex flex-wrap justify-between gap-2 text-[13px]"
              >
                <span>{channel.name}</span>
                <span className="text-muted-foreground">{channel.state}</span>
              </p>
            ))}
          </div>
        </section>
        <div className="mt-6 space-y-3">
          <Button asChild className="w-full" variant="outline">
            <Link href="/app/test-agent">
              <Play aria-hidden />
              Test agent
            </Link>
          </Button>
          <Link
            href="/app/conversations"
            className="flex items-center justify-between gap-2 py-1 text-xs font-medium text-primary"
          >
            Test conversation history
            <ArrowUpRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
