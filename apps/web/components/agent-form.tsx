"use client";
import { useActionState, useEffect, useState } from "react";
import { LockKeyhole, Save, ShieldCheck } from "lucide-react";
import type { AgentSettings } from "@avenlyo-app/shared";
import { saveAgent } from "@/app/app/agent/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

const options = [
  [
    "answer_questions",
    "Answer customer questions",
    "Turn published business knowledge into clear, helpful answers.",
  ],
  [
    "identify_interest",
    "Identify customer interest",
    "Recognize when someone is exploring your services or a project.",
  ],
  [
    "qualify_inquiries",
    "Qualify inquiries",
    "Check whether the requested contact details are present.",
  ],
  [
    "collect_contact",
    "Collect contact details",
    "Ask interested customers for the details you choose below.",
  ],
] as const;
const tones = [
  ["professional", "Professional", "Clear, composed and businesslike."],
  ["warm", "Warm", "Welcoming and conversational."],
  ["concise", "Concise", "Direct, with fewer words."],
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
  const [dirty, setDirty] = useState(false);
  const [collect, setCollect] = useState(
    settings.goals.includes("collect_contact"),
  );
  const [fields, setFields] = useState<string[]>(settings.contact_fields);
  useEffect(() => {
    if (state.status === "success") setDirty(false);
  }, [state]);
  return (
    <form action={action} onChange={() => setDirty(true)} className="max-w-5xl">
      {!editable && (
        <p className="form-message mb-6 flex items-center gap-2 border border-border bg-white text-muted-foreground">
          <LockKeyhole className="size-4" aria-hidden />
          You can review these settings. Only workspace owners can change them.
        </p>
      )}
      <section className="form-section">
        <div>
          <h2>What your agent does</h2>
          <p className="form-section-description">
            Start with the outcomes that matter for your customers.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map(([value, title, description]) => (
            <label key={value} className="option-card">
              <input
                name="goals"
                value={value}
                type="checkbox"
                defaultChecked={settings.goals.includes(value)}
                disabled={!editable || pending}
                onChange={
                  value === "collect_contact"
                    ? (e) => setCollect(e.target.checked)
                    : undefined
                }
              />
              <span>
                <span className="block text-[13px] font-medium">{title}</span>
                <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
                  {description}
                </span>
              </span>
            </label>
          ))}
          <label className="option-card sm:col-span-2">
            <input type="checkbox" checked disabled />
            <span className="flex-1">
              <span className="flex flex-wrap items-center justify-between gap-2 text-[13px] font-medium">
                Human handoff
                <span className="inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                  <ShieldCheck className="size-3" aria-hidden />
                  Always on
                </span>
              </span>
              <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
                Your team can step in when a customer asks, a request is
                unsupported, or a reliable answer needs a person.
              </span>
            </span>
          </label>
        </div>
      </section>
      <section className="form-section">
        <div>
          <h2>How it sounds</h2>
          <p className="form-section-description">
            Choose a voice that feels like your business. The same knowledge and
            boundaries apply to every tone.
          </p>
        </div>
        <fieldset>
          <legend className="sr-only">Tone</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {tones.map(([value, title, text]) => (
              <label key={value} className="option-card !block">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium">{title}</span>
                  <input
                    name="tone"
                    value={value}
                    type="radio"
                    defaultChecked={settings.tone === value}
                    disabled={!editable || pending}
                  />
                </span>
                <span className="mt-3 block text-xs leading-5 text-muted-foreground">
                  {text}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>
      <section className="form-section">
        <div>
          <h2>Details for useful inquiries</h2>
          <p className="form-section-description">
            Choose what your team needs to follow up. Details are requested when
            relevant to a customer’s interest.
          </p>
        </div>
        <div>
          <fieldset disabled={!editable || pending || !collect}>
            <legend className="sr-only">Contact details to collect</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["name", "email", "phone", "company"] as const).map((field) => (
                <label
                  key={field}
                  className={`option-card !items-center !py-3 ${!collect ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="contact_fields"
                    value={field}
                    checked={fields.includes(field)}
                    onChange={(e) =>
                      setFields((previous) =>
                        e.target.checked
                          ? [...previous, field]
                          : previous.filter((f) => f !== field),
                      )
                    }
                  />
                  <span className="text-[13px] font-medium capitalize">
                    {field}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {!collect && (
            <p className="mt-3 text-xs text-muted-foreground">
              Enable “Collect contact details” to request these fields.
            </p>
          )}
        </div>
      </section>
      <section className="form-section">
        <div>
          <h2>A note for your team</h2>
          <p className="form-section-description">
            Keep your setup intent here for reference. This note is not sent to
            the agent; the controls above determine its behavior.
          </p>
        </div>
        <div>
          <label htmlFor="setup-brief" className="text-[13px] font-medium">
            What should Avenlyo help your customers with?
          </label>
          <Textarea
            id="setup-brief"
            name="setup_brief"
            className="mt-3"
            defaultValue={settings.setup_brief}
            maxLength={1500}
            disabled={!editable || pending}
            placeholder="e.g. Help new customers understand our services and collect enough detail for our team to follow up."
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Optional · internal reference · up to 1,500 characters
          </p>
        </div>
      </section>
      <div className="save-bar">
        <p className="text-xs text-muted-foreground">
          {dirty
            ? "You have unsaved changes."
            : "Tests and customer channels use your saved settings."}
        </p>
        <Button disabled={!editable || pending} type="submit">
          <Save aria-hidden />
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
      {state.message && (
        <p
          role="status"
          className={`form-message ${state.status === "error" ? "bg-red-50 text-red-700" : "status-success"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
