"use client";
import { useActionState, useEffect, useId, useState } from "react";
import { languages, type Agent, type Language } from "@avenlyo-app/shared";
import { saveAgentLanguages } from "@/app/app/agent/actions";
import { Button, Notice } from "./ui";
import { useAgentLeaveGuard } from "./use-agent-leave-guard";
import { WorkspaceDialog } from "./workspace-dialog";
function LanguageEditor({ agent, close }: { agent: Agent; close: () => void }) {
  const primaryId = useId();
  const [primary, setPrimary] = useState(agent.primary_language),
    [additional, setAdditional] = useState(agent.additional_languages),
    [query, setQuery] = useState("");
  const [state, action, pending] = useActionState(saveAgentLanguages, {
    status: "idle" as const,
    message: "",
  });
  const dirty =
    primary !== agent.primary_language ||
    additional.join() !== agent.additional_languages.join();
  useAgentLeaveGuard(dirty && !pending);
  const attemptClose = () => {
    if (!pending && (!dirty || window.confirm("Discard your unsaved changes?")))
      close();
  };
  useEffect(() => {
    if (state.status === "success") close();
  }, [state, close]);
  return (
    <WorkspaceDialog open close={attemptClose} title="Edit languages">
      <form action={action}>
        <input type="hidden" name="agent_id" value={agent.id} />
        <div className="agent-dialog-body">
          <div className="agent-field">
            <label htmlFor={primaryId}>Primary language</label>
            <select
              id={primaryId}
              className="input"
              name="primary_language"
              value={primary}
              disabled={pending}
              onChange={(e) => {
                setPrimary(e.target.value);
                setAdditional((old) => old.filter((v) => v !== e.target.value));
              }}
            >
              {Object.entries(languages).map(([code, name]) => (
                <option value={code} key={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <p>
            Reply in the customer’s language when supported. Otherwise, use the
            primary language.
          </p>
          <label>
            Find a language
            <input
              className="input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {additional.map((code) => (
            <input
              key={code}
              type="hidden"
              name="additional_languages"
              value={code}
            />
          ))}
          <fieldset disabled={pending} className="agent-scope-list">
            <legend>Additional languages</legend>
            {Object.entries(languages)
              .filter(
                ([code, name]) =>
                  code !== primary &&
                  name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
              )
              .map(([code, name]) => (
                <label className="agent-check" key={code}>
                  <input
                    type="checkbox"
                    checked={additional.includes(code)}
                    onChange={() =>
                      setAdditional((old) =>
                        old.includes(code)
                          ? old.filter((v) => v !== code)
                          : [...old, code],
                      )
                    }
                  />
                  {name}
                </label>
              ))}
          </fieldset>
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
            {pending ? "Saving…" : "Save languages"}
          </Button>
        </div>
      </form>
    </WorkspaceDialog>
  );
}
export function AgentLanguages({
  agent,
  editable,
}: {
  agent: Agent;
  editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="agent-section"
      role="tabpanel"
      id="agent-panel"
      aria-labelledby="agent-tab-languages"
    >
      <h2>Languages</h2>
      <p>
        Use the same agent behavior and approved knowledge in every supported
        language.
      </p>
      {agent.language_policy === "legacy_multilingual" && (
        <Notice>
          Existing multilingual support is preserved. Save your language choices
          to limit replies to the languages you select.
        </Notice>
      )}
      <dl className="agent-summary">
        <div>
          <dt>Primary language</dt>
          <dd>
            {languages[agent.primary_language as Language] ??
              agent.primary_language}
          </dd>
          {editable && (
            <button className="agent-edit-button" onClick={() => setOpen(true)}>
              Change
            </button>
          )}
        </div>
      </dl>
      <h3 style={{ fontSize: 16, marginTop: 24 }}>Additional languages</h3>
      <ul className="agent-language-list">
        {agent.additional_languages.length ? (
          agent.additional_languages.map((code) => (
            <li key={code}>{languages[code as Language] ?? code}</li>
          ))
        ) : (
          <li className="agent-muted">
            {agent.language_policy === "legacy_multilingual"
              ? "Existing multilingual support"
              : "No additional languages"}
          </li>
        )}
      </ul>
      {editable && (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Add language
        </Button>
      )}
      {open && <LanguageEditor agent={agent} close={() => setOpen(false)} />}
    </section>
  );
}
