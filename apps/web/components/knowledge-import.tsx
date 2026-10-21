"use client";
import Link from "next/link";
import { useActionState } from "react";
import {
  importKnowledgeFile,
  importKnowledgeFromUrl,
} from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import { KnowledgeBack } from "./knowledge-primitives";
export function KnowledgeImport({
  source,
  editable,
}: {
  source: "file" | "webpage";
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(
    source === "file" ? importKnowledgeFile : importKnowledgeFromUrl,
    { status: "idle", message: "" } as FormState,
  );
  return (
    <div className="knowledge-focused">
      <KnowledgeBack />
      <header className="knowledge-heading">
        <div>
          <h1>{source === "file" ? "Upload file" : "Import webpage"}</h1>
          <p>
            {source === "file"
              ? "Turn an existing file into a draft you can review."
              : "Import one public page, then review it before publishing."}
          </p>
        </div>
      </header>
      <form action={action} className="knowledge-import-form">
        <input type="hidden" name="return_to" value="editor" />
        <label className="knowledge-field">
          <span>{source === "file" ? "Choose file" : "Website URL"}</span>
          {source === "file" ? (
            <input
              className="input"
              type="file"
              name="file"
              accept=".txt,.md,.markdown,.csv,.json,.html,.htm"
              required
              disabled={!editable || pending}
            />
          ) : (
            <input
              className="input"
              name="url"
              inputMode="url"
              placeholder="https://example.com/services"
              required
              disabled={!editable || pending}
            />
          )}
        </label>
        <p className="knowledge-input-help">
          {source === "file"
            ? "TXT, Markdown, CSV, JSON or HTML. Up to 1 MB. The first 6,000 characters are imported."
            : "Single-page import. Your information stays Draft until you publish it."}
        </p>
        {state.status === "error" && (
          <p className="knowledge-error" role="alert">
            {state.message}
          </p>
        )}
        <div className="knowledge-import-actions">
          <button
            className="button button-primary"
            disabled={!editable || pending}
          >
            {pending
              ? "Importing…"
              : source === "file"
                ? "Upload file"
                : "Import"}
          </button>
          <Link className="text-link" href="/app/knowledge/new">
            Add manually instead
          </Link>
        </div>
        {!editable && <p>Only the workspace owner can import knowledge.</p>}
      </form>
    </div>
  );
}
