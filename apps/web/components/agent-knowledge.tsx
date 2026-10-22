"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import type {
  Agent,
  KnowledgeItem,
  KnowledgeCollection,
} from "@avenlyo-app/shared";
import { saveAgentScope } from "@/app/app/agent/actions";
import { Button, Notice } from "./ui";
import { WorkspaceDialog } from "./workspace-dialog";
type Item = Pick<KnowledgeItem, "id" | "title" | "status" | "collection_id">;
export function AgentKnowledge({
  agent,
  items,
  collections,
  selected,
  editable,
}: {
  agent: Agent;
  items: Item[];
  collections: KnowledgeCollection[];
  selected: string[];
  editable: boolean;
}) {
  const [mode, setMode] = useState(agent.knowledge_mode),
    [ids, setIds] = useState(selected),
    [open, setOpen] = useState(false);
  const [query, setQuery] = useState(""),
    [collection, setCollection] = useState("");
  const [state, action, pending] = useActionState(saveAgentScope, {
    status: "idle" as const,
    message: "",
  });
  useEffect(() => {
    setMode(agent.knowledge_mode);
    setIds(selected);
  }, [agent.knowledge_mode, selected]);
  const dirty =
    mode !== agent.knowledge_mode ||
    [...ids].sort().join() !== [...selected].sort().join();
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const visible = useMemo(
    () =>
      items.filter(
        (i) =>
          (i.status === "published" || ids.includes(i.id)) &&
          i.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
          (!collection || i.collection_id === collection),
      ),
    [items, ids, query, collection],
  );
  const unavailable = items.filter(
    (i) => ids.includes(i.id) && i.status !== "published",
  ).length;
  const collectionCount = new Set(
    items
      .filter((i) => ids.includes(i.id) && i.collection_id)
      .map((i) => i.collection_id),
  ).size;
  const toggle = (id: string) =>
    setIds((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  return (
    <section
      className="agent-section"
      role="tabpanel"
      id="agent-panel"
      aria-labelledby="agent-tab-knowledge"
    >
      <h2>Knowledge</h2>
      <p>Choose what this agent can use when answering customers.</p>
      <form action={action}>
        <input type="hidden" name="agent_id" value={agent.id} />
        {mode === "selected" &&
          ids.map((id) => (
            <input key={id} type="hidden" name="item_ids" value={id} />
          ))}
        <fieldset
          disabled={!editable || pending}
          style={{ border: 0, padding: 0 }}
        >
          <legend className="sr-only">Knowledge scope</legend>
          <label className="agent-check">
            <input
              type="radio"
              name="mode"
              value="all"
              checked={mode === "all"}
              onChange={() => setMode("all")}
            />
            <span>
              All published knowledge
              <small>Use any currently published item in this workspace.</small>
            </span>
          </label>
          <label className="agent-check">
            <input
              type="radio"
              name="mode"
              value="selected"
              checked={mode === "selected"}
              onChange={() => setMode("selected")}
            />
            <span>
              Selected knowledge
              <small>Limit this agent to the items you choose.</small>
            </span>
          </label>
        </fieldset>
        {mode === "selected" && (
          <div style={{ marginBlock: 20 }}>
            <p>
              {collectionCount}{" "}
              {collectionCount === 1 ? "collection" : "collections"} ·{" "}
              {ids.length} {ids.length === 1 ? "item" : "items"} selected
            </p>
            {unavailable > 0 && (
              <Notice>
                {unavailable} selected{" "}
                {unavailable === 1 ? "item is" : "items are"} currently
                unavailable. Only published items can be used.
              </Notice>
            )}
            {!ids.length && (
              <p className="agent-muted">
                This agent will ask for team assistance when it has no approved
                information to answer.
              </p>
            )}
            {editable && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(true)}
                disabled={pending}
              >
                Manage selection
              </Button>
            )}
          </div>
        )}
        <p className="agent-muted">
          Draft and archived items are never available to this agent.
        </p>
        {state.status !== "idle" && (
          <Notice error={state.status === "error"}>{state.message}</Notice>
        )}
        {editable && (
          <Button disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save knowledge scope"}
          </Button>
        )}
      </form>
      <WorkspaceDialog
        open={open}
        close={() => setOpen(false)}
        title="Select knowledge"
      >
        <div className="agent-dialog-body">
          <label>
            Search knowledge
            <input
              type="search"
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {collections.length > 0 && (
            <label>
              Collection
              <select
                className="input"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
              >
                <option value="">All collections</option>
                {collections.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="agent-selection-tools">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setIds((old) =>
                  Array.from(
                    new Set([
                      ...old,
                      ...visible
                        .filter((i) => i.status === "published")
                        .map((i) => i.id),
                    ]),
                  ),
                )
              }
            >
              Select published results
            </Button>
            <button
              className="agent-edit-button"
              type="button"
              onClick={() => setIds([])}
            >
              Clear selection
            </button>
          </div>
          <div className="agent-scope-list">
            {visible.length ? (
              visible.map((item) => (
                <label key={item.id} className="agent-check">
                  <input
                    type="checkbox"
                    checked={ids.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <span>
                    {item.title}
                    {item.status !== "published" && (
                      <small>{item.status} · Unavailable</small>
                    )}
                  </span>
                </label>
              ))
            ) : (
              <p>No matching published knowledge.</p>
            )}
          </div>
        </div>
        <div className="agent-dialog-footer">
          <Button type="button" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </WorkspaceDialog>
    </section>
  );
}
