"use client";
import { useActionState } from "react";
import { ChevronDown, FileUp, Globe2, Loader2 } from "lucide-react";
import { importKnowledgeFile, importKnowledgeFromUrl } from "@/app/app/knowledge/actions";
import type { FormState } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function KnowledgeImportPanel({ mode = "toolbar" }: { mode?: "start" | "toolbar" }) {
  const [urlState, urlAction, urlPending] = useActionState(
    importKnowledgeFromUrl,
    { status: "idle", message: "" } as FormState,
  );
  const [fileState, fileAction, filePending] = useActionState(
    importKnowledgeFile,
    { status: "idle", message: "" } as FormState,
  );
  return (
    <div className={`knowledge-import-panel knowledge-import-${mode}`}>
      <details className="knowledge-import-card">
        <summary>
          <span className="knowledge-start-icon"><Globe2 aria-hidden /></span>
          <span><strong>Import webpage</strong><span>Paste a public FAQ, services or pricing page.</span></span>
          <ChevronDown aria-hidden className="knowledge-import-chevron" />
        </summary>
        <form action={urlAction} className="knowledge-import-form">
          <label htmlFor={`knowledge-import-url-${mode}`}>Website page</label>
          <div className="knowledge-import-inline">
            <Input id={`knowledge-import-url-${mode}`} name="url" type="text" inputMode="url" placeholder="myapp.com/faqs" required />
            <Button className="knowledge-primary-action" disabled={urlPending}>
              {urlPending ? <><Loader2 aria-hidden className="animate-spin" />Importing…</> : "Import"}
            </Button>
          </div>
          <p>Public HTML/text pages only. Imported content is saved as a draft.</p>
          {urlState.status === "error" && <p role="alert" className="knowledge-import-error">{urlState.message}</p>}
        </form>
      </details>
      <details className="knowledge-import-card">
        <summary>
          <span className="knowledge-start-icon"><FileUp aria-hidden /></span>
          <span><strong>Upload file</strong><span>Bring in an existing text-based document.</span></span>
          <ChevronDown aria-hidden className="knowledge-import-chevron" />
        </summary>
        <form action={fileAction} className="knowledge-import-form">
          <label htmlFor={`knowledge-import-file-${mode}`}>File</label>
          <input
            id={`knowledge-import-file-${mode}`}
            name="file"
            type="file"
            required
            accept=".txt,.md,.markdown,.csv,.json,.html,.htm,text/plain,text/markdown,text/csv,application/json,text/html"
            className="knowledge-file-input"
          />
          <div className="knowledge-import-submit">
            <span>TXT, MD, CSV, JSON or HTML · max 1 MB</span>
            <Button className="knowledge-primary-action" disabled={filePending}>
              {filePending ? <><Loader2 aria-hidden className="animate-spin" />Importing…</> : "Upload"}
            </Button>
          </div>
          {fileState.status === "error" && <p role="alert" className="knowledge-import-error">{fileState.message}</p>}
        </form>
      </details>
    </div>
  );
}
