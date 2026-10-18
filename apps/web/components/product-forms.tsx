"use client";
import Link from "next/link";
import {
  cloneElement,
  useActionState,
  useId,
  useState,
  type ReactElement,
} from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  FileUp,
  Globe2,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  businessKnowledgeType,
  contactFields,
  knowledgeLabels,
  knowledgeTypes,
  type AgentSettings,
  type ChannelConnection,
  type KnowledgeCollection,
  type KnowledgeItem,
} from "@avenlyo-app/shared";
import { signIn, signUp, type FormState } from "@/app/auth/actions";
import { createWorkspace } from "@/app/workspaces/actions";
import { saveAgent } from "@/app/app/agent/actions";
import { renameBusiness } from "@/app/app/settings/actions";
import {
  importKnowledgeFile,
  importKnowledgeFromUrl,
  knowledgeOperation,
  saveCollection,
  saveKnowledge,
} from "@/app/app/knowledge/actions";
import {
  disconnectInstagram,
  saveWebsiteChannel,
} from "@/app/app/channels/actions";
import { Badge, Button, Notice, Panel } from "./ui";
const initial: FormState = { message: "", status: "idle" };
function Feedback({ state }: { state: FormState }) {
  return state.status === "idle" ? null : (
    <Notice error={state.status === "error"}>{state.message}</Notice>
  );
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string }>;
}) {
  const id = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": hint ? `${id}-hint` : undefined,
      })}
      {hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}
export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const signup = mode === "signup";
  const [state, action, pending] = useActionState(
    signup ? signUp : signIn,
    initial,
  );
  return (
    <form action={action} className="auth-form">
      <Field label="Email address">
        <input
          className="input"
          type="email"
          name="email"
          placeholder="you@company.com"
          autoComplete="email"
          maxLength={254}
          required
        />
      </Field>
      <Field
        label="Password"
        hint={signup ? "Use at least 8 characters." : undefined}
      >
        <input
          className="input"
          type="password"
          name="password"
          placeholder={
            signup ? "Create a strong password" : "Enter your password"
          }
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={8}
          maxLength={128}
          required
        />
      </Field>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Please wait…" : signup ? "Create account" : "Sign in"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}
export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, initial);
  return (
    <form action={action}>
      <div className="form-section">
        <Field
          label="Business name"
          hint="You can change this later in Settings."
        >
          <input
            className="input"
            name="name"
            placeholder="e.g. Acme Studio"
            minLength={2}
            maxLength={100}
            required
          />
        </Field>
      </div>
      {state.status !== "idle" && (
        <div className="form-feedback">
          <Feedback state={state} />
        </div>
      )}
      <div className="form-footer">
        <p>A dedicated space for your team and customers.</p>
        <Button disabled={pending}>
          Create workspace
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
const goalCopy = [
  [
    "answer_questions",
    "Answer questions",
    "Help customers with your published business knowledge.",
  ],
  [
    "identify_interest",
    "Understand customer needs",
    "Find out what customers are looking for.",
  ],
  [
    "qualify_inquiries",
    "Qualify inquiries",
    "Identify useful opportunities for your team.",
  ],
  [
    "collect_contact",
    "Collect contact details",
    "Ask for the details your team needs to follow up.",
  ],
] as const;
export function AgentForm({
  settings,
  editable,
  published = 0,
  preview = false,
}: {
  settings: AgentSettings;
  editable: boolean;
  published?: number | null;
  preview?: boolean;
}) {
  const [state, action, pending] = useActionState(saveAgent, initial);
  const [tone, setTone] = useState(settings.tone);
  const [brief, setBrief] = useState(settings.setup_brief);
  const [collect, setCollect] = useState(
    settings.goals.includes("collect_contact"),
  );
  return (
    <form
      action={preview ? undefined : action}
      className="form-layout"
      onSubmit={preview ? (e) => e.preventDefault() : undefined}
    >
      <Panel>
        <fieldset disabled={!editable || preview || pending}>
          <div className="form-section">
            <div className="form-section-heading">
              <h2>Give your agent direction</h2>
              <p>
                A few clear instructions help your agent represent your
                business.
              </p>
            </div>
            <Field
              label="What should your agent know about its role?"
              hint="Use published Knowledge for factual details, prices and policies."
            >
              <textarea
                className="textarea"
                name="setup_brief"
                rows={5}
                placeholder="You are our welcoming first point of contact. Help customers understand our services and connect them with the right person…"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                maxLength={1500}
              />
            </Field>
            <p className="field-count">{brief.length} / 1,500</p>
          </div>
          <div className="form-section">
            <div className="form-section-heading">
              <h2>How should it sound?</h2>
              <p>Choose the communication style that fits your business.</p>
            </div>
            <fieldset>
              <legend className="sr-only">Communication style</legend>
              <div className="choice-grid">
                {(
                  [
                    ["professional", "Professional", "Polished and confident."],
                    ["warm", "Warm", "Friendly and approachable."],
                    ["concise", "Concise", "Clear and to the point."],
                  ] as const
                ).map(([value, title, description]) => (
                  <label className="radio-choice" key={value}>
                    <input
                      type="radio"
                      aria-label={title}
                      name="tone"
                      value={value}
                      checked={tone === value}
                      onChange={() => setTone(value)}
                    />
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="form-section">
            <div className="form-section-heading">
              <h2>What can it help with?</h2>
              <p>Keep your agent focused on the tasks that matter.</p>
            </div>
            {goalCopy.map(([value, title, description]) => (
              <label key={value} className="check-row">
                <input
                  type="checkbox"
                  name="goals"
                  value={value}
                  defaultChecked={settings.goals.includes(value)}
                  onChange={
                    value === "collect_contact"
                      ? (e) => setCollect(e.target.checked)
                      : undefined
                  }
                />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
            <label className="check-row">
              <input type="checkbox" checked disabled />
              <span>
                <strong>Connect customers with your team</strong>
                <small>Human assistance is always available.</small>
              </span>
            </label>
          </div>
          <div className="form-section">
            <div className="form-section-heading">
              <h2>Contact details</h2>
              <p>Choose what to collect when a customer is interested.</p>
            </div>
            <div className="check-grid">
              {contactFields.map((field) => (
                <label className="check-row" key={field}>
                  <input
                    type="checkbox"
                    name="contact_fields"
                    value={field}
                    defaultChecked={settings.contact_fields.includes(field)}
                    disabled={!collect}
                  />
                  <span>
                    <strong>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </strong>
                  </span>
                </label>
              ))}
            </div>
            {!collect && (
              <p className="field-hint">
                Enable contact collection above to select these details.
              </p>
            )}
          </div>
        </fieldset>
        {state.status !== "idle" && (
          <div className="form-feedback">
            <Feedback state={state} />
          </div>
        )}
        <div className="form-footer">
          <p>
            {preview
              ? "Design preview · changes are disabled"
              : editable
                ? "Your changes apply after saving."
                : "Only the workspace owner can edit these settings."}
          </p>
          <Button disabled={!editable || preview || pending}>
            <Save aria-hidden="true" />
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Panel>
      <aside className="form-aside" aria-label="Configuration preview">
        <Panel>
          <div className="configuration-header">
            <span className="avatar">
              <Sparkles aria-hidden="true" />
            </span>
            <h3>Your AI front office</h3>
            <p>Configuration preview</p>
          </div>
          <dl className="summary-list">
            <div>
              <dt>Communication</dt>
              <dd>{tone.charAt(0).toUpperCase() + tone.slice(1)}</dd>
            </div>
            <div>
              <dt>Knowledge</dt>
              <dd>
                {published === null
                  ? "Unavailable"
                  : `${published} published items`}
              </dd>
            </div>
            <div>
              <dt>Human assistance</dt>
              <dd>
                <Badge tone="success">Always available</Badge>
              </dd>
            </div>
            <div>
              <dt>Contact collection</dt>
              <dd>{collect ? "Enabled" : "Disabled"}</dd>
            </div>
          </dl>
        </Panel>
        <Panel className="help-copy">
          <BookOpen aria-hidden="true" />
          <h3>Good answers start with good knowledge.</h3>
          <p>
            Add your services, prices and frequently asked questions so your
            agent has the right context.
          </p>
          <Link className="text-link" href="/app/knowledge">
            Manage knowledge
            <ArrowRight aria-hidden="true" />
          </Link>
        </Panel>
      </aside>
    </form>
  );
}
export function BusinessForm({
  name,
  editable,
}: {
  name: string;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(renameBusiness, initial);
  return (
    <form action={action}>
      <div className="form-section">
        <Field label="Business name">
          <input
            className="input"
            name="name"
            defaultValue={name}
            required
            minLength={2}
            maxLength={100}
            disabled={!editable}
          />
        </Field>
      </div>
      {state.status !== "idle" && (
        <div className="form-feedback">
          <Feedback state={state} />
        </div>
      )}
      <div className="form-footer">
        <p>
          {editable
            ? "Used throughout your workspace."
            : "Only owners can change the business name."}
        </p>
        <Button disabled={!editable || pending}>Save changes</Button>
      </div>
    </form>
  );
}
export function KnowledgeForm({
  item,
  collections,
  editable = true,
  initialType,
}: {
  item?: KnowledgeItem;
  collections: KnowledgeCollection[];
  editable?: boolean;
  initialType?: string;
}) {
  const [state, action, pending] = useActionState(saveKnowledge, initial);
  const [type, setType] = useState(
    item
      ? businessKnowledgeType(item.type)
      : (knowledgeTypes.find((t) => t === initialType) ?? "custom_note"),
  );
  const [content, setContent] = useState(item?.content ?? "");
  return (
    <form action={action}>
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="revision" value={item?.revision ?? ""} />
      <fieldset disabled={!editable || pending}>
        <div className="form-section">
          <Field label="Knowledge type">
            <select
              className="select"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              {knowledgeTypes.map((t) => (
                <option key={t} value={t}>
                  {knowledgeLabels[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={type === "faq" ? "Question" : "Title"}>
            <input
              className="input"
              name="title"
              defaultValue={item?.title}
              placeholder={
                type === "faq"
                  ? "What would a customer ask?"
                  : "Give this item a clear, descriptive title"
              }
              required
              minLength={3}
              maxLength={180}
            />
          </Field>
          {type === "pricing" && (
            <>
              <Field label="Price or pricing statement">
                <input
                  className="input"
                  name="price_statement"
                  defaultValue={item?.price_statement}
                  placeholder="e.g. Plans start at $49 per month"
                  required
                  maxLength={240}
                />
              </Field>
              <Field
                label="Currency"
                hint="Optional three-letter code, such as USD, EUR or TRY."
              >
                <input
                  className="input"
                  name="currency"
                  defaultValue={item?.currency}
                  pattern="[A-Z]{3}|"
                  maxLength={3}
                  placeholder="USD"
                />
              </Field>
            </>
          )}
          <Field
            label={
              type === "faq"
                ? "Answer"
                : type === "pricing"
                  ? "Additional context"
                  : "Content"
            }
            hint="Write clear, factual information that your agent can share with customers."
          >
            <textarea
              className="textarea"
              name="content"
              rows={10}
              required={type !== "pricing"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={type === "service" ? 4000 : 6000}
              minLength={type === "pricing" ? undefined : 3}
              placeholder="Add the information your customers need…"
            />
          </Field>
          <p className="field-count">
            {content.length.toLocaleString()} /{" "}
            {type === "service" ? "4,000" : "6,000"}
          </p>
          {type === "service" && (
            <Field label="Details and limits">
              <textarea
                className="textarea"
                name="details"
                defaultValue={item?.details}
                maxLength={2000}
                rows={3}
                placeholder="Optional exclusions, requirements or limits"
              />
            </Field>
          )}
          <Field label="Collection">
            <select
              className="select"
              name="collection_id"
              defaultValue={item?.collection_id ?? ""}
            >
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>
      {state.status !== "idle" && (
        <div className="form-feedback">
          <Feedback state={state} />
        </div>
      )}
      <div className="form-footer">
        <p>Saved as a draft. Publish when you’re ready.</p>
        <div className="row">
          <Link className="button button-ghost" href="/app/knowledge">
            Cancel
          </Link>
          <Button disabled={!editable || pending}>
            {pending ? "Saving…" : "Save draft"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </form>
  );
}
export function KnowledgeActions({
  item,
  editable,
}: {
  item: KnowledgeItem;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(knowledgeOperation, initial);
  return (
    <div>
      <form
        action={action}
        className="knowledge-actions"
        onSubmit={(e) => {
          const submitter = (e.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
          if (
            submitter?.value === "delete" &&
            !window.confirm(`Delete “${item.title}”? This cannot be undone.`)
          )
            e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={item.id} />
        {item.status !== "archived" && (
          <Button
            variant="secondary"
            name="intent"
            value={item.status === "published" ? "draft" : "publish"}
            disabled={!editable || pending}
          >
            {pending
              ? "Working…"
              : item.status === "published"
                ? "Unpublish"
                : "Publish"}
          </Button>
        )}
        <details className="details-menu">
          <summary className="button button-ghost">
            More
            <ChevronDown aria-hidden="true" />
          </summary>
          <div className="menu-panel">
            {item.status === "archived" ? (
              <button
                name="intent"
                value="draft"
                disabled={!editable || pending}
              >
                Restore as draft
              </button>
            ) : (
              <button
                name="intent"
                value="archived"
                disabled={!editable || pending}
              >
                Archive item
              </button>
            )}
            <button
              name="intent"
              value="delete"
              disabled={!editable || pending}
              style={{ color: "var(--danger)" }}
            >
              Delete item
            </button>
          </div>
        </details>
      </form>
      {state.status !== "idle" && (
        <div style={{ marginTop: 10 }}>
          <Feedback state={state} />
        </div>
      )}
    </div>
  );
}
export function CollectionForm({
  collection,
}: {
  collection?: KnowledgeCollection;
}) {
  const [state, action, pending] = useActionState(saveCollection, initial);
  return (
    <form action={action} className="stack">
      <input type="hidden" name="id" value={collection?.id ?? ""} />
      <Field label="Collection name">
        <input
          className="input"
          name="name"
          placeholder="e.g. Getting started"
          defaultValue={collection?.name}
          required
          minLength={2}
          maxLength={80}
        />
      </Field>
      <Feedback state={state} />
      <Button disabled={pending} variant="secondary">
        {pending ? "Saving…" : collection ? "Save name" : "Create collection"}
      </Button>
    </form>
  );
}
export function ImportForms({ editable }: { editable: boolean }) {
  const [urlState, urlAction, urlPending] = useActionState(
    importKnowledgeFromUrl,
    initial,
  );
  const [fileState, fileAction, filePending] = useActionState(
    importKnowledgeFile,
    initial,
  );
  return (
    <div className="import-grid">
      <Panel className="import-card">
        <Globe2 aria-hidden="true" />
        <h3>Import a webpage</h3>
        <p>Turn a public page into a draft you can review.</p>
        <form action={urlAction} className="stack">
          <Field label="Website URL">
            <input
              className="input"
              name="url"
              placeholder="https://yourbusiness.com/services"
              required
              disabled={!editable}
            />
          </Field>
          <Feedback state={urlState} />
          <Button variant="secondary" disabled={!editable || urlPending}>
            {urlPending ? "Importing…" : "Import webpage"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </form>
      </Panel>
      <Panel className="import-card">
        <FileUp aria-hidden="true" />
        <h3>Upload a file</h3>
        <p>TXT, Markdown, CSV, JSON or HTML. Up to 1 MB.</p>
        <form action={fileAction} className="stack">
          <Field label="Choose file">
            <input
              className="input"
              type="file"
              name="file"
              accept=".txt,.md,.markdown,.csv,.json,.html,.htm"
              required
              disabled={!editable}
            />
          </Field>
          <Feedback state={fileState} />
          <Button variant="secondary" disabled={!editable || filePending}>
            {filePending ? "Uploading…" : "Import file"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </form>
      </Panel>
    </div>
  );
}
export function WebsiteForm({
  channel,
  editable,
}: {
  channel?: ChannelConnection;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(saveWebsiteChannel, initial);
  return (
    <form action={action}>
      <div className="form-section">
        <Field
          label="Approved websites"
          hint="One exact origin per line, for example https://yourbusiness.com."
        >
          <textarea
            className="textarea"
            name="origins"
            rows={3}
            defaultValue={channel?.approved_origins.join("\n")}
            placeholder="https://yourbusiness.com"
            required
            disabled={!editable}
          />
        </Field>
        <label className="check-row" style={{ marginTop: 12 }}>
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={channel?.enabled ?? true}
            disabled={!editable}
          />
          <span>
            <strong>Enable Website Chat</strong>
            <small>Your agent can respond on these approved websites.</small>
          </span>
        </label>
        <Feedback state={state} />
      </div>
      <div className="form-footer">
        <span className="section-note">
          <ShieldCheck aria-hidden="true" />
          Your approved sites only
        </span>
        <Button disabled={!editable || pending}>
          {pending ? "Saving…" : "Save channel"}
        </Button>
      </div>
    </form>
  );
}
export function WebsiteConfiguration({
  channel,
  editable,
}: {
  channel?: ChannelConnection;
  editable: boolean;
}) {
  const [open, setOpen] = useState(!channel?.enabled);
  return (
    <details
      className="disclosure"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        Configure Website Chat
        <ChevronDown aria-hidden="true" />
      </summary>
      <WebsiteForm channel={channel} editable={editable} />
    </details>
  );
}
export function EmbedSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const id = useId();
  return (
    <div className="stack">
      <pre className="code-snippet" id={id}>
        {code}
      </pre>
      <Button
        variant="secondary"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
        aria-describedby={id}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? "Copied" : "Copy snippet"}
      </Button>
      {failed && <Notice>Select and copy the snippet above.</Notice>}
    </div>
  );
}
export function DisconnectInstagram({ editable }: { editable: boolean }) {
  const [state, action, pending] = useActionState(disconnectInstagram, initial);
  return (
    <form
      action={action}
      className="stack"
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Disconnect Instagram? Your agent will stop replying on this channel.",
          )
        )
          e.preventDefault();
      }}
    >
      <Feedback state={state} />
      <Button variant="danger" disabled={!editable || pending}>
        {pending ? "Disconnecting…" : "Disconnect Instagram"}
      </Button>
    </form>
  );
}
