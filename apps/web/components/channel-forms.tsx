"use client";
import { useActionState, useState, type ReactNode } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import type { FormState } from "@/app/auth/actions";
import {
  saveWebsiteChannel,
  disconnectInstagram,
} from "@/app/app/channels/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
export function ConnectionManagement({
  label,
  initialOpen = false,
  children,
}: {
  label: string;
  initialOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <details
      className="connection-management mt-5"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        {label}
        <ChevronDown aria-hidden className="size-3.5" />
      </summary>
      <div className="connection-management-content">{children}</div>
    </details>
  );
}
export function WebsiteChannelForm({
  enabled,
  origins,
  editable,
}: {
  enabled: boolean;
  origins: string[];
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(saveWebsiteChannel, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form action={action} className="space-y-4">
      <label className="flex items-center gap-3 text-[13px] font-medium">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={enabled}
          disabled={!editable}
          className="size-4 accent-primary"
        />
        Enable Website Chat
      </label>
      <div>
        <label htmlFor="website-origins" className="text-sm font-medium">
          Approved website origins
        </label>
        <Textarea
          id="website-origins"
          name="origins"
          defaultValue={origins.join("\n")}
          disabled={!editable}
          required
          rows={2}
          placeholder={"https://example.com\nhttps://www.example.com"}
          maxLength={2500}
          className="mt-2 min-h-20 font-mono text-xs"
        />
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          One exact origin per line. Include https:// and each www variant you
          use. No paths or wildcards.
        </p>
      </div>
      <Button type="submit" size="sm" disabled={!editable || pending}>
        {pending ? "Saving…" : "Save Website Chat"}
      </Button>
      {state.message && (
        <p
          role="status"
          className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
export function EmbedSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <details className="mt-5 rounded-md border border-border bg-muted/30 px-4 py-3">
      <summary className="cursor-pointer text-xs font-medium">
        Website embed
      </summary>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Install on your website</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(snippet);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy snippet"}
        </Button>
      </div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/50 p-4 text-[11px] leading-6">
        <code>{snippet}</code>
      </pre>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Add this before your website’s closing body tag. Visitors can chat
        without an Avenlyo account.
      </p>
    </details>
  );
}
export function DisconnectInstagram({ editable }: { editable: boolean }) {
  const [state, action, pending] = useActionState(disconnectInstagram, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form action={action} className="mt-5">
      <Button size="sm" variant="outline" disabled={!editable || pending}>
        Disconnect Instagram
      </Button>
      {state.message && (
        <p
          role="status"
          className="mt-3 text-xs leading-6 text-muted-foreground"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
