"use client";
import { useEffect } from "react";
const tabChange = "avenlyo:agent-tab-change";
export function canChangeAgentTab() {
  return window.dispatchEvent(new Event(tabChange, { cancelable: true }));
}
export function useAgentLeaveGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const followLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const destination = new URL(link.href, window.location.href),
        current = new URL(window.location.href);
      if (
        destination.pathname === current.pathname &&
        destination.search === current.search
      )
        return;
      if (!window.confirm("Discard your unsaved changes?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const tabLeave = (event: Event) => {
      if (!window.confirm("Discard your unsaved changes?"))
        event.preventDefault();
    };
    window.addEventListener(tabChange, tabLeave);
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", followLink, true);
    return () => {
      window.removeEventListener(tabChange, tabLeave);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", followLink, true);
    };
  }, [dirty]);
}
