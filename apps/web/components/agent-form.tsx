"use client";
import { useActionState, useState } from "react";
import type { AgentSettings } from "@avenlyo-app/shared";
import { saveAgent } from "@/app/app/agent/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { FormFeedback } from "./form-feedback";
import Link from "next/link";
const options = [
  [
    "answer_questions",
    "Answer customer questions",
    "Use published knowledge for helpful answers.",
  ],
  [
    "identify_interest",
    "Identify customer interest",
    "Notice genuine service and project inquiries.",
  ],
  [
    "qualify_inquiries",
    "Qualify inquiries",
    "Check that the requested contact details are present.",
  ],
  [
    "collect_contact",
    "Collect contact details",
    "Ask interested customers for the selected fields.",
  ],
] as const;
export function AgentForm({
  settings,
  editable,
  workspaceId,
}: {
  settings: AgentSettings;
  editable: boolean;
  workspaceId: string;
}) {
  const [state, action, pending] = useActionState(saveAgent, {
    message: "",
    status: "idle",
  } as FormState);
  const [changed, setChanged] = useState(false);
  const [draft, setDraft] = useState(settings);
  const collectContact = draft.goals.includes("collect_contact");
  return (
    <form
      action={action}
      onChange={() => setChanged(true)}
      onSubmit={() => setChanged(false)}
      className="max-w-3xl space-y-5"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <fieldset disabled={pending || !editable} className="space-y-5">
        <Card className="p-5 sm:p-6">
          <label htmlFor="setup-brief" className="text-sm font-semibold">
            What should Avenlyo help your customers with?
          </label>
          <Textarea
            id="setup-brief"
            name="setup_brief"
            className="mt-3"
            value={draft.setup_brief}
            onChange={(event) =>
              setDraft({ ...draft, setup_brief: event.target.value })
            }
            aria-describedby="setup-brief-help"
            maxLength={1500}
            disabled={!editable}
            placeholder="Help customers understand our services, identify serious inquiries and collect their contact details."
          />
          <p
            id="setup-brief-help"
            className="mt-3 text-xs leading-5 text-muted-foreground"
          >
            Internal planning note (optional). Your agent does not read this
            note. The goals, tone and contact fields below control its behavior.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Goals</h2>
          <div className="mt-5 space-y-5">
            {options.map(([value, title, description]) => (
              <label key={value} className="flex items-start gap-3">
                <input
                  className="mt-1 size-4 accent-primary"
                  name="goals"
                  value={value}
                  type="checkbox"
                  checked={draft.goals.includes(value)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      goals: event.target.checked
                        ? [...draft.goals, value]
                        : draft.goals.filter((goal) => goal !== value),
                    })
                  }
                  disabled={!editable}
                />
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {description}
                  </span>
                </span>
              </label>
            ))}
            <label className="flex items-start gap-3">
              <input
                className="mt-1 size-4 accent-primary"
                type="checkbox"
                checked
                disabled
              />
              <span>
                <span className="block text-sm font-medium">Human handoff</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Always available when requested, unsupported, or needed for a
                  reliable answer.
                </span>
              </span>
            </label>
          </div>
        </Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Card className="p-6">
            <label htmlFor="tone" className="text-sm font-semibold">
              Tone
            </label>
            <p className="mt-2 text-xs text-muted-foreground">
              Choose how answers sound. Your published information stays the
              same.
            </p>
            <select
              id="tone"
              name="tone"
              className="mt-4 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
              value={draft.tone}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  tone: event.target.value as AgentSettings["tone"],
                })
              }
              disabled={!editable}
            >
              <option value="professional">Professional</option>
              <option value="warm">Warm</option>
              <option value="concise">Concise</option>
            </select>
          </Card>
          <Card className="p-6">
            <h2 className="text-sm font-semibold">
              Collect for qualified inquiries
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Only ask when relevant to genuine interest.
            </p>
            {!collectContact && (
              <p className="mt-3 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
                Enable “Collect contact details” in Goals to choose the fields
                your agent requests.
              </p>
            )}
            <fieldset
              disabled={!collectContact}
              className="mt-4 grid grid-cols-2 gap-3"
            >
              {(["name", "email", "phone", "company"] as const).map((field) => (
                <label
                  className="flex items-center gap-2 text-sm capitalize"
                  key={field}
                >
                  <input
                    className="size-4 accent-primary"
                    type="checkbox"
                    name="contact_fields"
                    value={field}
                    checked={draft.contact_fields.includes(field)}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        contact_fields: event.target.checked
                          ? [...draft.contact_fields, field]
                          : draft.contact_fields.filter(
                              (value) => value !== field,
                            ),
                      })
                    }
                    disabled={!editable}
                  />
                  {field}
                </label>
              ))}
            </fieldset>
          </Card>
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={!editable || pending} type="submit">
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state.status === "success" && !changed && !pending && (
          <Link
            href="/app/test-agent"
            className="text-sm font-medium text-primary underline"
          >
            Test saved settings →
          </Link>
        )}
        {!editable && (
          <p className="text-sm text-muted-foreground">
            Only workspace owners can change settings.
          </p>
        )}
      </div>
      {changed && !pending && (
        <p className="text-xs font-medium text-amber-900">Unsaved changes</p>
      )}
      <FormFeedback
        state={
          (changed && state.status === "success") || pending
            ? { status: "idle", message: "" }
            : state
        }
      />
    </form>
  );
}
