"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  FileUp,
  Globe2,
  Plus,
  X,
} from "lucide-react";
import { screenHref } from "@/lib/presentation";
export function KnowledgeDialog({
  open,
  close,
  title,
  children,
}: {
  open: boolean;
  close: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (open && previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="knowledge-dialog"
      aria-labelledby={titleId}
      onCancel={close}
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="knowledge-icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function KnowledgeBack({
  archived = false,
  preview = false,
}: {
  archived?: boolean;
  preview?: boolean;
}) {
  return (
    <Link
      href={screenHref(
        archived ? "/app/knowledge/archived" : "/app/knowledge",
        preview,
      )}
      className="knowledge-back"
    >
      <ArrowLeft aria-hidden="true" />
      {archived ? "Archived knowledge" : "Knowledge"}
    </Link>
  );
}
const creationChoices = [
  {
    path: "/app/knowledge/new",
    title: "Add manually",
    description: "Write a service, price, answer or business fact.",
    icon: FileText,
  },
  {
    path: "/app/knowledge/import?source=webpage",
    title: "Import webpage",
    description: "Review information from one public page.",
    icon: Globe2,
  },
  {
    path: "/app/knowledge/import?source=file",
    title: "Upload file",
    description: "Start with a TXT, Markdown, CSV, JSON or HTML file.",
    icon: FileUp,
  },
];
export function KnowledgeCreationChoices({
  preview = false,
  disabled = false,
}: {
  preview?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="knowledge-creation-choices">
      {creationChoices.map(({ path, title, description, icon: Icon }) =>
        disabled ? (
          <button key={title} className="knowledge-creation-choice" disabled>
            <Icon aria-hidden="true" />
            <span>
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
          </button>
        ) : (
          <Link
            key={title}
            href={screenHref(path, preview)}
            className="knowledge-creation-choice"
          >
            <Icon aria-hidden="true" />
            <span>
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
            <ArrowRight className="knowledge-choice-arrow" aria-hidden="true" />
          </Link>
        ),
      )}
    </div>
  );
}
export function AddKnowledge({
  preview = false,
  mobileOnly = false,
}: {
  preview?: boolean;
  mobileOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={mobileOnly ? "knowledge-mobile-add" : "knowledge-add"}>
      <button
        type="button"
        className="button button-primary"
        aria-label="Add knowledge"
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden="true" />
        <span>Add knowledge</span>
      </button>
      <KnowledgeDialog
        open={open}
        close={() => setOpen(false)}
        title="Add knowledge"
      >
        <KnowledgeCreationChoices preview={preview} />
      </KnowledgeDialog>
    </div>
  );
}
export function KnowledgeStatus({
  status,
}: {
  status: "draft" | "published" | "archived";
}) {
  return (
    <span className={`knowledge-status knowledge-status-${status}`}>
      {status === "draft"
        ? "Draft"
        : status === "published"
          ? "Published"
          : "Archived"}
    </span>
  );
}
