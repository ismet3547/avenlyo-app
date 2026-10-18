"use client";
import { useActionState, useState } from "react";
import { ChevronDown, FileUp, Globe2, Loader2 } from "lucide-react";
import { importKnowledgeFile, importKnowledgeFromUrl } from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type ImportKind = "url" | "file";

export function KnowledgeImportPanel({ mode = "toolbar" }: { mode?: "start" | "toolbar" }) {
  const [open, setOpen] = useState<ImportKind | null>(null);
  const [urlState, urlAction, urlPending] = useActionState(
    importKnowledgeFromUrl,
    { status: "idle", message: "" } as FormState,
  );
  const [fileState, fileAction, filePending] = useActionState(
    importKnowledgeFile,
    { status: "idle", message: "" } as FormState,
  );

  const trigger = (
    kind: ImportKind,
    icon: React.ReactNode,
    title: string,
    description: string,
  ) => (
    <button
      type="button"
      className="knowledge-import-trigger"
      aria-expanded={open === kind}
      aria-controls={`knowledge-import-${kind}-${mode}`}
      onClick={() => setOpen((current) => (current === kind ? null : kind))}
    >
      <span className="knowledge-start-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <ChevronDown aria-hidden className="knowledge-import-chevron" />
    </button>
  );

  return (
    <div className={`knowledge-import-panel knowledge-import-${mode}`}>
      {trigger("url", <Globe2 aria-hidden />, "Import webpage", "Paste a public FAQ, services or pricing page.")}
      {trigger("file", <FileUp aria-hidden />, "Upload file", "Bring in an existing text-based document.")}

      {open === "url" && (
        <div id={`knowledge-import-url-${mode}`} className="knowledge-import-body">
          <form action={urlAction} className="knowledge-import-form">
            <label htmlFor={`knowledge-import-url-input-${mode}`}>Website page</label>
            <div className="knowledge-import-inline">
              <Input
                id={`knowledge-import-url-input-${mode}`}
                name="url"
                type="text"
                inputMode="url"
                placeholder="yourbusiness.com/faqs"
                required
              />
              <Button className="knowledge-primary-action" disabled={urlPending}>
                {urlPending ? <><Loader2 aria-hidden className="animate-spin" />Importing…</> : "Import page"}
              </Button>
            </div>
            <p>Public HTML/text pages only. Imported content is always saved as a draft.</p>
            {urlState.status === "error" && (
              <p role="alert" className="knowledge-import-error">{urlState.message}</p>
            )}
          </form>
        </div>
      )}

      {open === "file" && (
        <div id={`knowledge-import-file-${mode}`} className="knowledge-import-body">
          <form action={fileAction} className="knowledge-import-form">
            <label htmlFor={`knowledge-import-file-input-${mode}`}>Choose file</label>
            <input
              id={`knowledge-import-file-input-${mode}`}
              name="file"
              type="file"
              required
              accept=".txt,.md,.markdown,.csv,.json,.html,.htm,text/plain,text/markdown,text/csv,application/json,text/html"
              className="knowledge-file-input"
            />
            <div className="knowledge-import-submit">
              <span>TXT, MD, CSV, JSON or HTML · max 1 MB</span>
              <Button className="knowledge-primary-action" disabled={filePending}>
                {filePending ? <><Loader2 aria-hidden className="animate-spin" />Importing…</> : "Upload file"}
              </Button>
            </div>
            {fileState.status === "error" && (
              <p role="alert" className="knowledge-import-error">{fileState.message}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
