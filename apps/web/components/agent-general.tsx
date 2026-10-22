"use client";
import { useActionState, useEffect, useId, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { Agent } from "@avenlyo-app/shared";
import { languages } from "@avenlyo-app/shared";
import {
  createAgent,
  saveAgentField,
  archiveAgent,
} from "@/app/app/agent/actions";
import type { FormState } from "@/app/auth/actions";
import { handlingLabels } from "@/lib/agent-model";
import { Button, Notice } from "./ui";
import { useAgentLeaveGuard, canChangeAgentTab } from "./use-agent-leave-guard";
import { WorkspaceDialog } from "./workspace-dialog";
const initial: FormState = { status: "idle", message: "" };
export function CreateAgent() {
  const primaryId = useId(),
    briefId = useId();
  const [open, setOpen] = useState(false),
    [dirty, setDirty] = useState(false);
  const [state, action, pending] = useActionState(createAgent, initial);
  useAgentLeaveGuard(open && dirty && !pending);
  const close = () => {
    if (
      !pending &&
      (!dirty || window.confirm("Discard your unsaved changes?"))
    ) {
      setOpen(false);
      setDirty(false);
    }
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>Create agent</Button>
      <WorkspaceDialog open={open} close={close} title="Create agent">
        <form action={action} onChange={() => setDirty(true)}>
          <div className="agent-dialog-body">
            <label>
              Agent name
              <input
                className="input"
                name="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Sales Assistant"
                disabled={pending}
              />
            </label>
            <div className="agent-field">
              <label htmlFor={briefId}>What should this agent help with?</label>
              <textarea
                id={briefId}
                className="textarea"
                name="setup_brief"
                rows={3}
                required
                minLength={3}
                maxLength={1500}
                placeholder="Qualify new customer inquiries and collect contact details."
                disabled={pending}
              />
            </div>
            <div className="agent-field">
              <label htmlFor={primaryId}>Primary language</label>
              <select
                id={primaryId}
                className="input"
                name="primary_language"
                defaultValue="en"
                disabled={pending}
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            {state.status === "error" && <Notice error>{state.message}</Notice>}
          </div>
          <div className="agent-dialog-footer">
            <Button
              type="button"
              variant="secondary"
              onClick={close}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button disabled={pending}>
              {pending ? "Creating…" : "Create agent"}
            </Button>
          </div>
        </form>
      </WorkspaceDialog>
    </>
  );
}
export function AgentTabs({ id }: { id: string }) {
  const path = usePathname(),
    router = useRouter(),
    base = `/app/agent/${id}`;
  const tabs = [
    [base, "General"],
    [`${base}/knowledge`, "Knowledge"],
    [`${base}/languages`, "Languages"],
  ];
  return (
    <nav className="agent-tabs" role="tablist" aria-label="Agent settings">
      {tabs.map(([href, label], index) => (
        <Link
          key={href}
          id={`agent-tab-${label.toLowerCase()}`}
          role="tab"
          href={href}
          aria-selected={path === href}
          aria-controls="agent-panel"
          tabIndex={path === href ? 0 : -1}
          onKeyDown={(e) => {
            let next: number | undefined;
            if (e.key === "ArrowRight") next = (index + 1) % 3;
            if (e.key === "ArrowLeft") next = (index + 2) % 3;
            if (e.key === "Home") next = 0;
            if (e.key === "End") next = 2;
            if (next !== undefined) {
              e.preventDefault();
              if (!canChangeAgentTab()) return;
              document
                .getElementById(`agent-tab-${tabs[next][1].toLowerCase()}`)
                ?.focus();
              router.push(tabs[next][0]);
            }
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
type Field = "name" | "role" | "tone" | "goals" | "contacts";
const titles: Record<Field, string> = {
  name: "Name",
  role: "Role",
  tone: "Communication style",
  goals: "Customer handling",
  contacts: "Contact details",
};
function EditAgent({
  agent,
  field,
  close,
  saved,
}: {
  agent: Agent;
  field: Field;
  close: () => void;
  saved: () => void;
}) {
  const roleId = useId();
  const [state, action, pending] = useActionState(saveAgentField, initial),
    [dirty, setDirty] = useState(false);
  useAgentLeaveGuard(dirty && !pending);
  const attemptClose = () => {
    if (!pending && (!dirty || window.confirm("Discard your unsaved changes?")))
      close();
  };
  useEffect(() => {
    if (state.status === "success") saved();
  }, [state, saved]);
  return (
    <WorkspaceDialog
      open
      close={attemptClose}
      title={`Edit ${titles[field].toLowerCase()}`}
    >
      <form action={action} onChange={() => setDirty(true)}>
        <input type="hidden" name="agent_id" value={agent.id} />
        <input type="hidden" name="field" value={field} />
        <div className="agent-dialog-body">
          {field === "name" && (
            <label>
              Agent name
              <input
                className="input"
                name="name"
                defaultValue={agent.name}
                required
                minLength={2}
                maxLength={80}
                disabled={pending}
              />
            </label>
          )}
          {field === "role" && (
            <>
              <div className="agent-field">
                <label htmlFor={roleId}>
                  What should this agent help customers with?
                </label>
                <textarea
                  id={roleId}
                  className="textarea"
                  name="setup_brief"
                  rows={4}
                  defaultValue={agent.setup_brief}
                  maxLength={1500}
                  disabled={pending}
                />
              </div>
              <p>
                Describe what customers usually need help with and when your
                team should get involved.
              </p>
            </>
          )}
          {field === "tone" && (
            <fieldset disabled={pending}>
              <legend>Communication style</legend>
              {(
                [
                  ["professional", "Professional", "Polished and confident."],
                  ["warm", "Warm", "Friendly and approachable."],
                  ["concise", "Concise", "Clear and to the point."],
                ] as const
              ).map(([value, label, description]) => (
                <label className="agent-check" key={value}>
                  <input
                    type="radio"
                    name="tone"
                    value={value}
                    defaultChecked={agent.tone === value}
                  />
                  <span>
                    {label}
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {field === "goals" && (
            <fieldset disabled={pending}>
              <legend>Customer handling</legend>
              {Object.entries(handlingLabels).map(([value, label]) => (
                <label className="agent-check" key={value}>
                  <input
                    type="checkbox"
                    name="goals"
                    value={value}
                    defaultChecked={agent.goals.includes(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          )}
          {field === "contacts" && (
            <fieldset disabled={pending}>
              <legend>Details your team needs</legend>
              {["name", "email", "phone", "company"].map((value) => (
                <label className="agent-check" key={value}>
                  <input
                    type="checkbox"
                    name="contact_fields"
                    value={value}
                    defaultChecked={agent.contact_fields.includes(value)}
                  />
                  {value[0].toUpperCase() + value.slice(1)}
                </label>
              ))}
            </fieldset>
          )}
          {state.status === "error" && <Notice error>{state.message}</Notice>}
        </div>
        <div className="agent-dialog-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={attemptClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </WorkspaceDialog>
  );
}
export function AgentGeneral({
  agent,
  editable,
}: {
  agent: Agent;
  editable: boolean;
}) {
  const [field, setField] = useState<Field | null>(null);
  const [notice, setNotice] = useState("");
  const rows: [Field, string][] = [
    ["name", agent.name],
    ["role", agent.setup_brief || "Describe how this agent helps customers."],
    ["tone", agent.tone[0].toUpperCase() + agent.tone.slice(1)],
    [
      "goals",
      Object.entries(handlingLabels)
        .filter(([key]) => agent.goals.includes(key))
        .map(([, label]) => label.replace("customer ", ""))
        .join(" · ") || "Human assistance",
    ],
    [
      "contacts",
      agent.goals.includes("collect_contact")
        ? agent.contact_fields
            .map((s) => s[0].toUpperCase() + s.slice(1))
            .join(", ") || "No fields selected"
        : "Not collected",
    ],
  ];
  return (
    <section
      className="agent-section"
      role="tabpanel"
      id="agent-panel"
      aria-labelledby="agent-tab-general"
    >
      <h2>General</h2>
      {notice && <Notice>{notice}</Notice>}
      {!editable && (
        <p className="agent-muted">
          Only workspace owners can change this agent.
        </p>
      )}
      <dl className="agent-summary">
        {rows.map(([key, summary]) => (
          <div key={key}>
            <dt>{titles[key]}</dt>
            <dd className={key === "role" ? "agent-role-summary" : undefined}>
              {summary}
            </dd>
            {editable &&
              (key !== "contacts" ||
                agent.goals.includes("collect_contact")) && (
                <button
                  className="agent-edit-button"
                  aria-label={`Edit ${titles[key].toLowerCase()}`}
                  onClick={() => {
                    setNotice("");
                    setField(key);
                  }}
                >
                  Edit
                </button>
              )}
          </div>
        ))}
        <div>
          <dt>Human handoff</dt>
          <dd>
            <p>Always available</p>
            <small>Customers can always ask to speak with your team.</small>
          </dd>
        </div>
      </dl>
      {editable && !agent.is_default && <ArchiveAgent agent={agent} />}
      {field && (
        <EditAgent
          key={field}
          agent={agent}
          field={field}
          close={() => setField(null)}
          saved={() => {
            setField(null);
            setNotice("Changes saved.");
          }}
        />
      )}
    </section>
  );
}

export function ArchiveAgent({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false),
    [state, action, pending] = useActionState(archiveAgent, initial);
  return (
    <div className="agent-maintenance">
      <button className="agent-edit-button" onClick={() => setOpen(true)}>
        Archive agent
      </button>
      <WorkspaceDialog
        open={open}
        close={() => {
          if (!pending) setOpen(false);
        }}
        title="Archive agent"
      >
        <form action={action}>
          <input type="hidden" name="agent_id" value={agent.id} />
          <div className="agent-dialog-body">
            <p>
              Archive {agent.name}? Conversation history will be preserved. Move
              its channels to another agent first.
            </p>
            {state.status === "error" && <Notice error>{state.message}</Notice>}
          </div>
          <div className="agent-dialog-footer">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button variant="danger" disabled={pending}>
              Archive agent
            </Button>
          </div>
        </form>
      </WorkspaceDialog>
    </div>
  );
}
