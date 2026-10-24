"use client";
import { useActionState } from "react";
import type { AgentSettings } from "@avenlyo-app/shared";
import { saveAgent } from "@/app/app/agent/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
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
  return (
    <form action={action} className="max-w-3xl space-y-5">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <Card className="p-6">
        <label htmlFor="setup-brief" className="text-sm font-semibold">
          What should Avenlyo help your customers with?
        </label>
        <Textarea
          id="setup-brief"
          name="setup_brief"
          className="mt-3"
          defaultValue={settings.setup_brief}
          maxLength={1500}
          disabled={!editable}
          placeholder="Help customers understand our services, identify serious inquiries and collect their contact details."
        />
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Describe your objective. The structured controls below define
          supported behavior; your brief cannot override product policy.
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
                defaultChecked={settings.goals.includes(value)}
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
            Changes presentation, never permissions.
          </p>
          <select
            id="tone"
            name="tone"
            className="mt-4 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
            defaultValue={settings.tone}
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
          <div className="mt-4 grid grid-cols-2 gap-3">
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
                  defaultChecked={settings.contact_fields.includes(field)}
                  disabled={!editable}
                />
                {field}
              </label>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={!editable || pending} type="submit">
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state.message && (
          <p
            role="status"
            className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}
          >
            {state.message}
          </p>
        )}
        {!editable && (
          <p className="text-sm text-muted-foreground">
            Only workspace owners can change settings.
          </p>
        )}
      </div>
    </form>
  );
}
