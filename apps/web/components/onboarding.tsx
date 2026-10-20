"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  FileUp,
  Globe2,
} from "lucide-react";
import {
  contactFields,
  type AgentSettings,
  type ChannelConnection,
  type KnowledgeItem,
} from "@avenlyo-app/shared";
import {
  saveSetupAgent,
  activateSetupWebsite,
  skipSetupChannel,
} from "@/app/onboarding/actions";
import {
  importKnowledgeFile,
  importKnowledgeFromUrl,
  knowledgeOperation,
} from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import {
  setupSteps,
  setupProgress,
  type OnboardingState,
} from "@/lib/onboarding-model";
import { Button, Notice } from "./ui";
import { TestAgent } from "./conversations";
import { KnowledgeForm } from "./product-forms";
const initial: FormState = { status: "idle", message: "" };
function Feedback({ state }: { state: FormState }) {
  return state.status === "idle" ? null : (
    <Notice error={state.status === "error"}>{state.message}</Notice>
  );
}
export function SetupAccordion({
  state,
  active,
  children,
}: {
  state: OnboardingState;
  active: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const { done, next } = setupProgress(state);
  const requiredCount = done.slice(0, 3).filter(Boolean).length;
  return (
    <>
      <header className="onboarding-heading">
        <h1>Let’s get your front office ready.</h1>
        <p>Prepare your agent, then connect a channel when you’re ready.</p>
      </header>
      <div className="setup-progress">
        <strong>{requiredCount} of 3 required steps complete</strong>
        <div
          role="progressbar"
          aria-label="Front office setup"
          aria-valuenow={requiredCount}
          aria-valuemin={0}
          aria-valuemax={3}
        >
          <span style={{ width: `${(requiredCount / 3) * 100}%` }} />
        </div>
      </div>
      <div className="onboarding-steps">
        {setupSteps.map(([key, title, success], index) => (
          <section
            className={`onboarding-step ${active === index ? "is-current" : ""}`}
            key={key}
          >
            <h2>
              <button
                id={`step-${key}`}
                aria-expanded={active === index}
                aria-controls={active === index ? `panel-${key}` : undefined}
                disabled={!done[index] && index !== next}
                onClick={() =>
                  router.push(`/onboarding?step=${key}`, { scroll: false })
                }
              >
                <span
                  className={`onboarding-step-number ${done[index] ? "is-done" : ""}`}
                >
                  {done[index] ? <Check aria-hidden="true" /> : index + 1}
                </span>
                <span>
                  {done[index] && active !== index ? success : title}
                  {key === "channel" && !done[index] && (
                    <span className="setup-optional">Optional</span>
                  )}
                </span>
                <ChevronDown className="setup-chevron" aria-hidden="true" />
              </button>
            </h2>
            {active === index && (
              <div
                className="onboarding-step-content"
                role="region"
                id={`panel-${key}`}
                aria-labelledby={`step-${key}`}
              >
                {children}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
export function SetupAgent({
  settings,
  editable,
}: {
  settings: AgentSettings;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(saveSetupAgent, initial);
  return (
    <form action={action} className="setup-form">
      <fieldset disabled={!editable || pending}>
        {settings.goals
          .filter((g) => g !== "human_handoff")
          .map((goal) => (
            <input key={goal} type="hidden" name="goals" value={goal} />
          ))}
        <label className="field">
          <span className="field-label">
            What should your agent help customers with?
          </span>
          <textarea
            className="textarea"
            name="setup_brief"
            maxLength={1500}
            rows={3}
            defaultValue={settings.setup_brief}
            placeholder="Help customers understand our services and connect interested customers with our team."
          />
        </label>
        <label className="field">
          <span className="field-label">Tone</span>
          <select className="select" name="tone" defaultValue={settings.tone}>
            <option value="professional">Professional</option>
            <option value="warm">Warm</option>
            <option value="concise">Concise</option>
          </select>
        </label>
        {settings.goals.includes("collect_contact") && (
          <fieldset className="setup-contact">
            <legend>Contact details for your team to follow up</legend>
            <div>
              {contactFields.map((field) => (
                <label key={field}>
                  <input
                    type="checkbox"
                    name="contact_fields"
                    value={field}
                    defaultChecked={settings.contact_fields.includes(field)}
                  />
                  {field[0].toUpperCase() + field.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <p className="setup-help">
          Customers can always ask for a person. Your team handles these
          requests in Inbox.
        </p>
      </fieldset>
      <Feedback state={state} />
      <Button disabled={!editable || pending}>
        {pending ? "Saving…" : "Save and continue"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}
function SetupImport({
  method,
  editable,
}: {
  method: "webpage" | "file";
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(
    method === "file" ? importKnowledgeFile : importKnowledgeFromUrl,
    initial,
  );
  return (
    <form action={action} className="setup-form">
      <input type="hidden" name="onboarding" value="true" />
      {method === "webpage" ? (
        <label className="field">
          <span className="field-label">Website URL</span>
          <input
            className="input"
            name="url"
            placeholder="https://yourbusiness.com/services"
            required
            disabled={!editable || pending}
          />
        </label>
      ) : (
        <label className="field">
          <span className="field-label">Choose file</span>
          <input
            className="input"
            name="file"
            type="file"
            accept=".txt,.md,.markdown,.csv,.json,.html,.htm"
            aria-describedby="setup-file-hint"
            required
            disabled={!editable || pending}
          />
        </label>
      )}
      {method === "file" && (
        <p id="setup-file-hint" className="setup-help">
          TXT, Markdown, CSV, JSON or HTML. Up to 1 MB.
        </p>
      )}
      <p className="setup-help">
        Import as a draft, then review and publish it for your agent.
      </p>
      <Feedback state={state} />
      <Button disabled={!editable || pending}>
        {pending
          ? "Importing…"
          : method === "file"
            ? "Upload file"
            : "Import webpage"}
      </Button>
    </form>
  );
}
function SetupPublish({
  item,
  editable,
}: {
  item: KnowledgeItem;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(knowledgeOperation, initial);
  return (
    <form action={action} className="setup-publish">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="intent" value="publish" />
      <div>
        <strong>Review your draft below.</strong>
        <p>Publish when it’s ready for customer answers.</p>
      </div>
      <Button disabled={!editable || pending}>
        {pending ? "Publishing…" : "Publish"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}
export function SetupKnowledge({
  item,
  items,
  editable,
  published,
}: {
  item?: KnowledgeItem;
  items: KnowledgeItem[];
  editable: boolean;
  published: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState<"manual" | "webpage" | "file" | null>(
    null,
  );
  return (
    <div className="setup-knowledge">
      <p className="setup-help">
        Give your agent a useful answer about your business. At least one item
        must be published to continue.
      </p>
      {item ? (
        <>
          {editing ? (
            <KnowledgeForm
              key={`${item.id}-${item.revision}`}
              item={item}
              collections={[]}
              editable={editable}
              onboarding
            />
          ) : (
            <>
              <div className="setup-knowledge-review">
                <h3>{item.title}</h3>
                <p>
                  {[item.price_statement, item.content, item.details]
                    .filter(Boolean)
                    .join("\n\n")}
                </p>
              </div>
              {item.status === "published" ? (
                <div className="setup-published">
                  <Check aria-hidden="true" />
                  <strong>Knowledge published</strong>
                </div>
              ) : (
                <SetupPublish item={item} editable={editable} />
              )}
              <div className="row">
                <Button
                  variant="secondary"
                  disabled={!editable}
                  onClick={() => setEditing(true)}
                >
                  Edit {item.status === "published" ? "knowledge" : "draft"}
                </Button>
                <Link className="text-link" href="/onboarding?step=knowledge">
                  Back to knowledge
                </Link>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="setup-methods">
            {(
              [
                ["manual", "Add manually", "Write a useful answer", FileText],
                [
                  "webpage",
                  "Import webpage",
                  "Start from your website",
                  Globe2,
                ],
                ["file", "Upload file", "Use an existing document", FileUp],
              ] as const
            ).map(([key, title, detail, Icon]) => (
              <button
                className={method === key ? "is-selected" : ""}
                type="button"
                key={key}
                aria-pressed={method === key}
                onClick={() => setMethod(key)}
              >
                <Icon aria-hidden="true" />
                <strong>{title}</strong>
                <span>{detail}</span>
              </button>
            ))}
          </div>
          {method === "manual" && (
            <KnowledgeForm collections={[]} editable={editable} onboarding />
          )}
          {(method === "webpage" || method === "file") && (
            <SetupImport key={method} method={method} editable={editable} />
          )}
          {items.length > 0 && (
            <div className="setup-drafts">
              <h3>Your knowledge</h3>
              {items.map((k) => (
                <Link
                  key={k.id}
                  href={`/onboarding?step=knowledge&item=${k.id}`}
                >
                  <span>{k.title}</span>
                  <span>
                    {k.status === "published" ? "Published" : "Review draft"}{" "}
                    <ArrowRight aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      {published && !editing && (
        <Link className="button button-primary" href="/onboarding?step=test">
          Continue to test <ArrowRight aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
export function SetupTest({
  workspaceId,
  tested,
}: {
  workspaceId: string;
  tested: boolean;
}) {
  const [successful, setSuccessful] = useState(tested);
  const router = useRouter();
  return (
    <div className="setup-test">
      <p className="setup-help">Ask something your customers might ask.</p>
      <TestAgent
        workspaceId={workspaceId}
        focused
        onSuccessfulTurn={() => {
          setSuccessful(true);
          router.refresh();
        }}
      />
      <div className="setup-test-actions">
        {successful && (
          <Link
            className="button button-primary"
            href="/onboarding?step=channel"
          >
            Looks good, continue <ArrowRight aria-hidden="true" />
          </Link>
        )}
        <Link className="text-link" href="/onboarding?step=agent">
          Improve agent
        </Link>
      </div>
    </div>
  );
}
export function SetupChannel({
  website,
  snippet,
  editable,
  instagramConnected,
}: {
  website?: ChannelConnection;
  snippet: ReactNode;
  editable: boolean;
  instagramConnected: boolean;
}) {
  const [channel, setChannel] = useState<"website" | "instagram">("website");
  const [state, action, pending] = useActionState(
    activateSetupWebsite,
    initial,
  );
  const [skipState, skipAction, skipping] = useActionState(
    skipSetupChannel,
    initial,
  );
  const router = useRouter();
  return (
    <div className="setup-channel">
      <p className="setup-help">
        Choose where your customers will reach Avenlyo.
      </p>
      <div className="setup-channel-options">
        <button
          type="button"
          aria-pressed={channel === "website"}
          onClick={() => setChannel("website")}
        >
          Website Chat
        </button>
        <button
          type="button"
          aria-pressed={channel === "instagram"}
          onClick={() => setChannel("instagram")}
        >
          Instagram
        </button>
      </div>
      {channel === "website" ? (
        <>
          <p>
            Add the chat snippet to your website, approve its address, then
            activate Website Chat.
          </p>
          {snippet}
          <form className="setup-form" action={action}>
            <input
              type="hidden"
              name="enabled"
              value={website ? "on" : "off"}
            />
            <label className="field">
              <span className="field-label">Approved websites</span>
              <textarea
                className="textarea"
                name="origins"
                aria-describedby="setup-origins-hint"
                rows={2}
                defaultValue={website?.approved_origins.join("\n")}
                placeholder="https://yourbusiness.com"
                required
                disabled={!editable || pending || skipping}
              />
            </label>
            <p id="setup-origins-hint" className="setup-help">
              One exact origin per line, for example https://yourbusiness.com.
            </p>
            <Feedback state={state} />
            <Button disabled={!editable || pending || skipping}>
              {pending
                ? "Saving…"
                : website
                  ? "Activate Website Chat"
                  : "Prepare Website Chat"}
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </>
      ) : (
        <div className="stack">
          <h3>
            {instagramConnected
              ? "Instagram connected"
              : "Connect Instagram with your administrator"}
          </h3>
          <p>
            Instagram uses a managed connection. Ask your workspace
            administrator to arrange setup and verify your account.
          </p>
          <Button variant="secondary" onClick={() => router.refresh()}>
            Check connection
          </Button>
        </div>
      )}
      <form className="setup-skip" action={skipAction}>
        <Feedback state={skipState} />
        <button className="text-link" disabled={pending || skipping}>
          {skipping ? "Continuing…" : "Set up later"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  );
}
