"use client";
import { useRef } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Button } from "./ui/button";
export function MobileNavigation() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    dialog.current?.close();
    trigger.current?.focus();
  }
  return (
    <div className="lg:hidden">
      <Button
        ref={trigger}
        variant="ghost"
        size="icon"
        aria-label="Open navigation"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Menu aria-hidden />
      </Button>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        aria-label="Workspace navigation"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onClose={() => trigger.current?.focus()}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close navigation"
          className="absolute right-3 top-3"
          onClick={close}
        >
          <X aria-hidden />
        </Button>
        <Sidebar onNavigate={close} />
      </dialog>
    </div>
  );
}
