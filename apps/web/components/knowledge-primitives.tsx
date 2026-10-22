"use client";
import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  FileUp,
  Globe2,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react";
import { screenHref } from "@/lib/presentation";
export function KnowledgeDialog({
  id,
  open,
  close,
  title,
  children,
}: {
  id?: string;
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
      id={id}
      ref={ref}
      className="knowledge-dialog"
      aria-labelledby={titleId}
      onCancel={close}
      onClose={close}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "a[href], button, input, select, textarea, [tabindex]",
          ),
        ).filter(
          (control) =>
            control.tabIndex >= 0 &&
            !control.matches(":disabled") &&
            control.getClientRects().length > 0,
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        const boundary = event.shiftKey ? first : last;
        if (
          document.activeElement === boundary ||
          document.activeElement === event.currentTarget
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }}
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

// Native auto popovers provide light dismissal and an invoker relationship;
// measured placement keeps the panel beside its trigger without page offsets.
export function KnowledgePopover({
  id,
  open,
  onOpenChange,
  anchor,
  title,
  children,
  menu = false,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: RefObject<HTMLButtonElement | null>;
  title: string;
  children: ReactNode;
  menu?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const position = () => {
    const panel = ref.current,
      trigger = anchor.current;
    if (!panel || !trigger) return;
    const target = trigger.getBoundingClientRect();
    const box = panel.getBoundingClientRect();
    const width = box.width || Number.parseFloat(getComputedStyle(panel).width);
    const inset = 16,
      gap = 8;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const below = target.bottom + gap;
    const above = target.top - box.height - gap;
    const y =
      below + box.height > viewportHeight - inset && above >= inset
        ? above
        : Math.max(inset, Math.min(below, viewportHeight - box.height - inset));
    panel.style.setProperty(
      "--knowledge-popover-x",
      `${Math.max(inset, Math.min(target.right - width, viewportWidth - width - inset))}px`,
    );
    panel.style.setProperty("--knowledge-popover-y", `${y}px`);
  };
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    if (!open) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      return;
    }
    position();
    const initial = menu
      ? panel.querySelector<HTMLElement>('[role="menuitem"]')
      : (panel.querySelector<HTMLElement>("input:checked") ??
        panel.querySelector<HTMLElement>("button"));
    initial?.focus();
    const observer = new ResizeObserver(position);
    observer.observe(panel);
    if (anchor.current) observer.observe(anchor.current);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, anchor, menu]);
  return (
    <div
      ref={ref}
      id={id}
      popover="auto"
      role={menu ? "menu" : "dialog"}
      aria-labelledby={menu ? undefined : titleId}
      aria-label={menu ? title : undefined}
      className={`knowledge-popover ${menu ? "knowledge-context-menu" : "knowledge-filter-popover"}`}
      onBeforeToggle={(event) => {
        if (event.newState === "open") position();
      }}
      onToggle={(event) => {
        const shown = event.newState === "open";
        onOpenChange(shown);
        if (
          !shown &&
          (event.currentTarget.contains(document.activeElement) ||
            document.activeElement === document.body)
        )
          anchor.current?.focus();
      }}
      onKeyDown={(event) => {
        if (!menu) return;
        if (event.key === "Tab") {
          onOpenChange(false);
          return;
        }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            '[role="menuitem"]',
          ),
        );
        const current = items.indexOf(document.activeElement as HTMLElement);
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (current +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  items.length) %
                items.length;
        items[index]?.focus();
      }}
    >
      {!menu && (
        <header>
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="knowledge-icon-button"
            aria-label="Close filters"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" />
          </button>
        </header>
      )}
      {children}
    </div>
  );
}

export function KnowledgeOverflow({ preview = false }: { preview?: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="knowledge-icon-button"
        aria-label="Organize knowledge"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        popoverTarget={id}
      >
        <MoreHorizontal aria-hidden="true" />
      </button>
      <KnowledgePopover
        id={id}
        open={open}
        onOpenChange={setOpen}
        anchor={trigger}
        title="Organize knowledge"
        menu
      >
        <Link
          role="menuitem"
          href={screenHref("/app/knowledge/archived", preview)}
          onClick={() => setOpen(false)}
        >
          View archived
        </Link>
        <Link
          role="menuitem"
          href={screenHref("/app/knowledge/collections", preview)}
          onClick={() => setOpen(false)}
        >
          Manage collections
        </Link>
      </KnowledgePopover>
    </>
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
  const id = useId();
  return (
    <div className={mobileOnly ? "knowledge-mobile-add" : "knowledge-add"}>
      <button
        type="button"
        className="button button-primary"
        aria-label="Add knowledge"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden="true" />
        <span>Add knowledge</span>
      </button>
      <KnowledgeDialog
        open={open}
        close={() => setOpen(false)}
        title="Add knowledge"
        id={id}
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
