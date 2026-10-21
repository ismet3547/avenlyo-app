"use client";
import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { KnowledgeCollection, KnowledgeItem } from "@avenlyo-app/shared";
import type { FormState } from "@/app/auth/actions";
import { saveCollection } from "@/app/app/knowledge/actions";
import { KnowledgeBack, KnowledgeDialog } from "./knowledge-primitives";
function CollectionEditor({
  collection,
  close,
}: {
  collection?: KnowledgeCollection;
  close: () => void;
}) {
  const [state, action, pending] = useActionState(saveCollection, {
    status: "idle",
    message: "",
  } as FormState);
  useEffect(() => {
    if (state.status === "success") close();
  }, [state, close]);
  return (
    <form action={action} className="knowledge-filter-form">
      <input type="hidden" name="id" value={collection?.id ?? ""} />
      <label className="knowledge-field">
        <span>Collection name</span>
        <input
          className="input"
          name="name"
          defaultValue={collection?.name}
          minLength={2}
          maxLength={80}
          required
          disabled={pending}
          autoFocus
        />
      </label>
      {state.status === "error" && (
        <p className="knowledge-error" role="alert">
          {state.message}
        </p>
      )}
      <div className="knowledge-dialog-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={close}
        >
          Cancel
        </button>
        <button className="button button-primary" disabled={pending}>
          {pending ? "Saving…" : collection ? "Save name" : "Create collection"}
        </button>
      </div>
    </form>
  );
}
export function KnowledgeCollections({
  items,
  collections,
  editable,
}: {
  items: KnowledgeItem[];
  collections: KnowledgeCollection[];
  editable: boolean;
}) {
  const [editing, setEditing] = useState<KnowledgeCollection | "new" | null>(
    null,
  );
  return (
    <>
      <KnowledgeBack />
      <header className="knowledge-heading">
        <div>
          <h1>Collections</h1>
          <p>Simple groups to help you find related knowledge.</p>
        </div>
        {editable && (
          <button
            className="button button-primary"
            onClick={() => setEditing("new")}
          >
            <Plus aria-hidden="true" />
            Create collection
          </button>
        )}
      </header>
      <ul className="knowledge-collection-list">
        {collections.map((collection) => {
          const count = items.filter(
            (item) =>
              item.collection_id === collection.id &&
              item.status !== "archived",
          ).length;
          return (
            <li key={collection.id}>
              <div>
                <h2>{collection.name}</h2>
                <p>
                  {count} {count === 1 ? "item" : "items"}
                </p>
              </div>
              {editable && (
                <button
                  className="text-link"
                  onClick={() => setEditing(collection)}
                  aria-label={`Rename ${collection.name}`}
                >
                  Rename
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {!collections.length && (
        <p className="knowledge-no-collections">
          Create a collection when you want to group related knowledge.
        </p>
      )}
      <KnowledgeDialog
        open={Boolean(editing)}
        close={() => setEditing(null)}
        title={editing === "new" ? "Create collection" : "Rename collection"}
      >
        {editing && (
          <CollectionEditor
            key={editing === "new" ? "new" : editing.id}
            collection={editing === "new" ? undefined : editing}
            close={() => setEditing(null)}
          />
        )}
      </KnowledgeDialog>
    </>
  );
}
