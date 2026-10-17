"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Check, Play, UserRound } from "lucide-react";
import type { AgentSettings } from "@avenlyo-app/shared";
import { saveAgent } from "@/app/app/agent/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { FormSection } from "./form-section";
const options = [
  [
    "answer_questions",
    "Answer customer questions",
    "Give helpful answers from published business knowledge.",
  ],
  [
    "identify_interest",
    "Identify customer interest",
    "Recognize genuine service and project inquiries.",
  ],
  [
    "qualify_inquiries",
    "Qualify inquiries",
    "Check that the details your team needs are present.",
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
}: {
  settings: AgentSettings;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(saveAgent, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form action={action} className="page-narrow">
      <Card className="overflow-hidden">
        <FormSection
          number="01"
          title="Business objective"
          description="Give your agent a clear purpose."
        >
          <label htmlFor="setup-brief" className="text-[13px] font-medium">
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
        </FormSection>
        <FormSection
          number="02"
          title="Goals"
          description="Choose the work Avenlyo should help with."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map(([value, title, description]) => (
              <label key={value} className="choice-card">
                <input
                  className="mt-1 size-4 shrink-0"
                  name="goals"
                  value={value}
                  type="checkbox"
                  defaultChecked={settings.goals.includes(value)}
                  disabled={!editable}
                />
                <span>
                  <span className="block text-[13px] font-medium">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-3 rounded-md border border-border bg-muted/50 p-4">
            <input className="size-4" type="checkbox" checked disabled />
            <span className="text-[13px] font-medium">Human handoff</span>
            <span className="ml-auto text-xs text-muted-foreground">
              Always available
            </span>
          </label>
        </FormSection>
        <FormSection
          number="03"
          title="Communication style"
          description="Choose a tone that feels right for your business."
        >
          <fieldset>
            <legend className="sr-only">Tone</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["professional", "Professional", "Clear and considered."],
                ["warm", "Warm", "Friendly and approachable."],
                ["concise", "Concise", "Direct and to the point."],
              ].map(([value, title, description]) => (
                <label className="choice-card" key={value}>
                  <input
                    type="radio"
                    name="tone"
                    value={value}
                    defaultChecked={settings.tone === value}
                    disabled={!editable}
                    className="mt-1 size-4 shrink-0"
                  />
                  <span>
                    <span className="block text-[13px] font-medium">
                      {title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </FormSection>
        <FormSection
          number="04"
          title="Contact details to collect"
          description="Ask for these details when a customer shows genuine interest."
        >
          <fieldset>
            <legend className="sr-only">Contact details</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["name", "email", "phone", "company"] as const).map((field) => (
                <label key={field} className="choice-card items-center">
                  <input
                    type="checkbox"
                    name="contact_fields"
                    value={field}
                    defaultChecked={settings.contact_fields.includes(field)}
                    disabled={!editable}
                    className="size-4"
                  />
                  <span className="text-[13px] capitalize">{field}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </FormSection>
        <FormSection
          number="05"
          title="Human assistance"
          description="Your team can always take over when a person is needed."
        >
          <div className="flex gap-3 rounded-lg bg-success-soft p-4">
            <UserRound aria-hidden className="mt-1 size-4 text-primary" />
            <div>
              <p className="text-[13px] font-medium">
                A clear handoff, with your team in control.
              </p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                Requests for a person and questions without enough published
                information pause AI. Claiming or replying keeps it paused until
                your team explicitly resumes it.
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                <Check aria-hidden className="size-3.5" />
                Human handoff remains available.
              </p>
            </div>
          </div>
        </FormSection>
      </Card>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Button disabled={!editable || pending} type="submit">
            {pending ? "Saving…" : "Save settings"}
          </Button>
          {state.message && (
            <p
              role="status"
              className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}
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
        <Button asChild variant="ghost">
          <Link href="/app/test-agent">
            <Play aria-hidden />
            Test agent
          </Link>
        </Button>
      </div>
    </form>
  );
}
