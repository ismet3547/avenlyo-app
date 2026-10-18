"use client";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Button } from "./ui/button";
const labels: Record<string, string> = {
  agent: "Agent",
  inbox: "Inbox",
  leads: "Leads",
  knowledge: "Knowledge",
  channels: "Channels",
  settings: "Settings",
  "test-agent": "Test Agent",
  conversations: "Test history",
};
export function Breadcrumb() {
  const segments = usePathname().split("/").filter(Boolean);
  return (
    <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">Workspace</span>
      <ChevronRight className="hidden size-3 sm:block" aria-hidden="true" />
      <span className="truncate font-medium text-foreground">
        {labels[segments[1]] ?? "Home"}
      </span>
      {segments[2] && (
        <>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="truncate">
            {segments[2] === "new" ? "New item" : "Details"}
          </span>
        </>
      )}
    </p>
  );
}
export function MobileNavigation() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        aria-label="Open navigation"
        onClick={() => dialog.current?.showModal()}
      >
        <Menu aria-hidden="true" />
      </Button>
      <dialog
        ref={dialog}
        className="mobile-navigation"
        aria-label="Workspace navigation"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close navigation"
          className="absolute right-3 top-3"
          onClick={() => dialog.current?.close()}
        >
          <X aria-hidden="true" />
        </Button>
        <Sidebar onNavigate={() => dialog.current?.close()} />
      </dialog>
    </>
  );
}
