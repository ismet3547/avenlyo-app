"use client";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import {
  knowledgeLabels,
  knowledgeSchema,
  knowledgeTypes,
  type KnowledgeCollection,
  type KnowledgeItem,
  type KnowledgeType,
} from "@avenlyo-app/shared";
import {
  knowledgeEditorOperation,
  saveKnowledge,
} from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import {
  convertKnowledgeType,
  joinServiceDetails,
  knowledgeFieldLabels,
  knowledgeFields,
  splitServiceDetails,
  type KnowledgeFields,
} from "@/lib/knowledge-model";
import {
  KnowledgeBack,
  KnowledgeDialog,
  KnowledgeStatus,
} from "./knowledge-primitives";

const initial: FormState = { status: "idle", message: "" };
function EditorField({
  name,
  label,
  error,
  children,
  optional = false,
}: {
  name: string;
  label: string;
  error?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="knowledge-field">
      <label htmlFor={`knowledge-${name}`}>
        {label}
        {optional && (
          <span className="knowledge-optional" aria-hidden="true">
            {" "}
            (optional)
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="knowledge-field-error" id={`knowledge-${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
function useKnowledgeLeaveGuard(dirty: boolean) {
  const router = useRouter();
  const bypass = useRef(false);
  const [destination, setDestination] = useState<
    | { href: string }
    | { form: HTMLFormElement; submitter: HTMLElement | null }
    | null
  >(null);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!bypass.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      if (
        bypass.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, location.href);
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      event.preventDefault();
      event.stopPropagation();
      setDestination({ href: url.href });
    };
    const submit = (event: SubmitEvent) => {
      if (
        bypass.current ||
        !(event.target instanceof HTMLFormElement) ||
        event.target.closest("[data-knowledge-editor]")
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setDestination({ form: event.target, submitter: event.submitter });
    };
    const currentUrl = location.href;
    const currentState = history.state;
    const pop = (event: PopStateEvent) => {
      if (bypass.current || location.href === currentUrl) return;
      const href = location.href;
      event.stopImmediatePropagation();
      history.pushState(currentState, "", currentUrl);
      setDestination({ href });
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    window.addEventListener("popstate", pop, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
      window.removeEventListener("popstate", pop, true);
    };
  }, [dirty]);
  const discard = () => {
    if (!destination) return;
    bypass.current = true;
    if ("form" in destination)
      destination.form.requestSubmit(
        destination.submitter instanceof HTMLButtonElement ||
          destination.submitter instanceof HTMLInputElement
          ? destination.submitter
          : undefined,
      );
    else {
      const url = new URL(destination.href);
      if (url.origin === location.origin)
        router.push(`${url.pathname}${url.search}${url.hash}`);
      else location.assign(url.href);
    }
    setDestination(null);
  };
  return (
    <KnowledgeDialog
      open={Boolean(destination)}
      close={() => setDestination(null)}
      title="You have unsaved changes."
    >
      <p>Keep editing, or discard these changes before leaving.</p>
      <div className="knowledge-dialog-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setDestination(null)}
        >
          Keep editing
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={discard}
        >
          Discard changes
        </button>
      </div>
    </KnowledgeDialog>
  );
}
export function KnowledgeEditor({
  item,
  initialType = "custom_note",
  collections,
  editable,
  notice,
  source,
  preview = false,
}: {
  item?: KnowledgeItem;
  initialType?: KnowledgeType;
  collections: KnowledgeCollection[];
  editable: boolean;
  notice?: string;
  source?: string;
  preview?: boolean;
}) {
  const [fields, setFields] = useState(() =>
    knowledgeFields(item, initialType),
  );
  const [state, saveAction, pending] = useActionState(saveKnowledge, initial);
  const [operationState, operationAction, operating] = useActionState(
    knowledgeEditorOperation,
    initial,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [changeType, setChangeType] = useState<KnowledgeType | null>(null);
  const [confirm, setConfirm] = useState<
    "draft" | "archived" | "delete" | null
  >(null);
  const baseline = knowledgeFields(item, initialType);
  const dirty = JSON.stringify(fields) !== JSON.stringify(baseline);
  const status = item?.status ?? "draft";
  const busy = pending || operating;
  const archived = status === "archived";
  const guard = useKnowledgeLeaveGuard(dirty && !busy);
  const labels = knowledgeFieldLabels[fields.type];
  const service = splitServiceDetails(fields.details);
  const update = (name: keyof KnowledgeFields, value: string) => {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };
  const inputProps = (name: string) => ({
    id: `knowledge-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `knowledge-${name}-error` : undefined,
  });
  const imported =
    item?.status === "draft" &&
    (notice === "webpage-imported" || notice === "file-imported");
  const savedMessage =
    notice === "saved" && status === "draft"
      ? "Draft saved"
      : notice === "published" && status === "published"
        ? "Published"
        : notice === "draft" && status === "draft"
          ? "Moved to draft"
          : notice === "file-imported" && imported
            ? "File imported as draft"
            : notice === "webpage-imported" && imported
              ? `Imported from ${source || "a webpage"}`
              : "";
  return (
    <div className="knowledge-editor" data-knowledge-editor>
      <KnowledgeBack archived={archived} preview={preview} />
      <header className="knowledge-heading">
        <div>
          <div className="knowledge-editor-title">
            <h1>
              {imported
                ? "Review imported knowledge"
                : item?.title ||
                  `New ${knowledgeLabels[fields.type].toLowerCase()}`}
            </h1>
            <KnowledgeStatus status={status} />
          </div>
          <p>
            {status === "published"
              ? "Available to your agent."
              : archived
                ? "Archived — your agent cannot use this information."
                : "Your agent cannot use this yet. Review it, then publish when you’re ready."}
          </p>
        </div>
        {item && editable && (
          <details className="knowledge-overflow">
            <summary
              className="knowledge-icon-button"
              aria-label="More actions"
            >
              <MoreHorizontal aria-hidden="true" />
            </summary>
            <div>
              {!archived && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");
                    setConfirm("archived");
                  }}
                >
                  Archive
                </button>
              )}
              <button
                type="button"
                className="knowledge-danger-text"
                onClick={(event) => {
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                  setConfirm("delete");
                }}
              >
                Delete
              </button>
            </div>
          </details>
        )}
      </header>
      {savedMessage && (
        <p className="knowledge-save-status" role="status">
          {savedMessage}
        </p>
      )}
      {notice === "publish-failed" && status === "draft" && (
        <p className="knowledge-error" role="alert">
          Your draft was saved, but we couldn’t publish it right now. Please try
          again.
        </p>
      )}
      <form
        action={saveAction}
        className="knowledge-editor-form"
        onSubmit={(event) => {
          if (archived) return;
          const result = knowledgeSchema.safeParse({
            ...fields,
            collection_id: fields.collection_id || null,
          });
          if (!result.success) {
            event.preventDefault();
            const next: Record<string, string> = {};
            for (const issue of result.error.issues) {
              const name = String(issue.path[0] ?? "content");
              next[name] = issue.message;
            }
            setErrors(next);
            const name = String(result.error.issues[0].path[0]);
            event.currentTarget
              .querySelector<HTMLElement>(
                name === "details"
                  ? "#knowledge-additional"
                  : `[name="${name}"]`,
              )
              ?.focus();
          }
        }}
      >
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <input type="hidden" name="revision" value={item?.revision ?? ""} />
        <input type="hidden" name="return_to" value="editor" />
        <fieldset disabled={!editable || busy || archived}>
          <EditorField name="type" label="Type">
            <select
              {...inputProps("type")}
              className="select knowledge-type-select"
              name="type"
              value={fields.type}
              onChange={(event) => {
                const type = event.target.value as KnowledgeType;
                if (
                  fields.title ||
                  fields.content ||
                  fields.details ||
                  fields.price_statement
                )
                  setChangeType(type);
                else setFields((current) => ({ ...current, type }));
              }}
            >
              {knowledgeTypes.map((type) => (
                <option key={type} value={type}>
                  {knowledgeLabels[type]}
                </option>
              ))}
            </select>
          </EditorField>
          <EditorField name="title" label={labels[0]} error={errors.title}>
            <input
              {...inputProps("title")}
              className="input"
              name="title"
              value={fields.title}
              onChange={(e) => update("title", e.target.value)}
              required
              minLength={3}
              maxLength={180}
            />
          </EditorField>
          {fields.type === "pricing" && (
            <EditorField
              name="price_statement"
              label="Price statement"
              error={errors.price_statement}
            >
              <input
                {...inputProps("price_statement")}
                className="input"
                name="price_statement"
                value={fields.price_statement}
                onChange={(e) => update("price_statement", e.target.value)}
                required
                maxLength={240}
                placeholder="Projects typically start at $2,500."
              />
            </EditorField>
          )}
          <EditorField name="content" label={labels[1]} error={errors.content}>
            <textarea
              {...inputProps("content")}
              className="textarea"
              name="content"
              value={fields.content}
              onChange={(e) => update("content", e.target.value)}
              rows={7}
              required={fields.type !== "pricing"}
              minLength={fields.type === "pricing" ? undefined : 3}
              maxLength={fields.type === "service" ? 4000 : 6000}
            />
          </EditorField>
          {fields.type === "service" && (
            <>
              <input type="hidden" name="details" value={fields.details} />
              <EditorField
                name="additional"
                label="Additional details"
                optional
                error={errors.details}
              >
                <textarea
                  id="knowledge-additional"
                  className="textarea"
                  rows={3}
                  value={service.additional}
                  onChange={(e) =>
                    update(
                      "details",
                      joinServiceDetails(e.target.value, service.pricingNote),
                    )
                  }
                  maxLength={2000}
                  aria-invalid={errors.details ? true : undefined}
                  aria-describedby={
                    errors.details ? "knowledge-additional-error" : undefined
                  }
                />
              </EditorField>
              <EditorField name="pricing-note" label="Pricing note" optional>
                <textarea
                  id="knowledge-pricing-note"
                  className="textarea"
                  rows={2}
                  value={service.pricingNote}
                  onChange={(e) =>
                    update(
                      "details",
                      joinServiceDetails(service.additional, e.target.value),
                    )
                  }
                  maxLength={2000}
                  placeholder="Projects are quoted individually."
                />
              </EditorField>
            </>
          )}
          {fields.type === "pricing" && (
            <details
              className="knowledge-secondary-fields"
              open={Boolean(fields.currency) || undefined}
            >
              <summary>Currency (optional)</summary>
              <EditorField
                name="currency"
                label="Currency"
                error={errors.currency}
              >
                <input
                  {...inputProps("currency")}
                  className="input"
                  name="currency"
                  value={fields.currency}
                  onChange={(e) =>
                    update("currency", e.target.value.toUpperCase())
                  }
                  pattern="[A-Z]{3}|"
                  maxLength={3}
                  placeholder="USD"
                />
              </EditorField>
            </details>
          )}
          <EditorField name="collection_id" label="Collection" optional>
            <select
              id="knowledge-collection_id"
              className="select"
              name="collection_id"
              value={fields.collection_id}
              onChange={(e) => update("collection_id", e.target.value)}
            >
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </EditorField>
        </fieldset>
        {state.status === "error" && (
          <p role="alert" className="knowledge-error">
            {state.message}
          </p>
        )}
        {operationState.status === "error" && (
          <p role="alert" className="knowledge-error">
            {operationState.message}
          </p>
        )}
        {!editable && <p>Only the workspace owner can edit knowledge.</p>}
        <footer className="knowledge-editor-footer">
          {status === "published" && (
            <p>
              Saving changes returns this item to Draft. Publish it again after
              review.
            </p>
          )}
          <div className="knowledge-editor-buttons">
            {archived ? (
              <button
                className="button button-primary"
                name="intent"
                value="draft"
                formAction={operationAction}
                disabled={!editable || busy}
              >
                Restore as draft
              </button>
            ) : (
              <>
                <button
                  className={`button ${status === "published" ? "button-primary" : "button-secondary"}`}
                  name="intent"
                  value="save"
                  disabled={!editable || busy}
                >
                  {busy
                    ? "Saving…"
                    : status === "published"
                      ? "Save changes"
                      : "Save draft"}
                </button>
                {status === "draft" ? (
                  <button
                    className="button button-primary"
                    name="intent"
                    value="publish"
                    formAction={item && !dirty ? operationAction : undefined}
                    disabled={!editable || busy}
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setConfirm("draft")}
                    disabled={!editable || busy}
                  >
                    Unpublish
                  </button>
                )}
              </>
            )}
          </div>
        </footer>
      </form>
      <KnowledgeDialog
        open={Boolean(changeType)}
        close={() => setChangeType(null)}
        title="Change knowledge type?"
      >
        <p>
          Existing pricing and service details will move into the main text so
          you can review them before saving.
        </p>
        {errors.conversion && (
          <p role="alert" className="knowledge-error">
            {errors.conversion}
          </p>
        )}
        <div className="knowledge-dialog-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setChangeType(null)}
          >
            Keep current type
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              if (!changeType) return;
              const converted = convertKnowledgeType(fields, changeType);
              if (!converted) {
                setErrors({
                  conversion:
                    "This information is too long for the new type. Shorten it first or keep its current type; nothing has been removed.",
                });
                return;
              }
              setFields(converted);
              setErrors({});
              setChangeType(null);
            }}
          >
            Change type
          </button>
        </div>
      </KnowledgeDialog>
      <KnowledgeDialog
        open={Boolean(confirm)}
        close={() => setConfirm(null)}
        title={
          confirm === "draft"
            ? "Unpublish this knowledge?"
            : confirm === "archived"
              ? "Archive this knowledge?"
              : "Delete this knowledge?"
        }
      >
        <p>
          {confirm === "draft"
            ? "Avenlyo will stop using this information in customer answers."
            : confirm === "archived"
              ? "This information will leave the library and stop being available to your agent. You can restore it as a draft."
              : `“${item?.title}” will be permanently removed.${status === "published" ? " Avenlyo currently uses this information." : ""}`}
        </p>
        {dirty && <p>Your unsaved changes will be discarded.</p>}
        <form action={operationAction}>
          <input type="hidden" name="id" value={item?.id ?? ""} />
          <div className="knowledge-dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              className={`button ${confirm === "delete" ? "button-danger" : "button-primary"}`}
              name="intent"
              value={confirm ?? ""}
              disabled={!editable || busy}
            >
              {confirm === "draft"
                ? "Unpublish"
                : confirm === "archived"
                  ? "Archive"
                  : "Delete"}
            </button>
          </div>
        </form>
      </KnowledgeDialog>
      {guard}
    </div>
  );
}
