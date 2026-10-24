"use client";
import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Sidebar } from "./sidebar";
export function MobileNav() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  function close() {
    dialog.current?.close();
  }
  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        className="px-2 font-semibold text-foreground"
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <Menu aria-hidden /> Avenlyo
      </Button>
      <dialog
        id="mobile-navigation"
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
        aria-label="Workspace navigation"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(20rem,90vw)] max-w-full border-0 border-r border-border bg-white p-5 text-foreground shadow-xl backdrop:bg-slate-950/40"
      >
        <div className="mb-4 flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={close}
            aria-label="Close navigation"
          >
            <X aria-hidden />
          </Button>
        </div>
        <div className="flex min-h-[calc(100%-4rem)] flex-col">
          <Sidebar onNavigate={close} />
          <Link
            href="/workspaces"
            onClick={close}
            className="mt-5 rounded-lg px-3 py-3 text-sm text-primary"
          >
            Manage workspaces →
          </Link>
        </div>
      </dialog>
    </div>
  );
}
