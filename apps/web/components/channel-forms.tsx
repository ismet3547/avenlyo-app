"use client";
import { useActionState, useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { FormState } from "@/app/auth/actions";
import {
  saveWebsiteChannel,
  disconnectInstagram,
} from "@/app/app/channels/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
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
    <form action={action} className="mt-6 space-y-5">
      <label className="flex items-center gap-3 text-sm font-medium">
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
          rows={3}
          placeholder={"https://example.com\nhttps://www.example.com"}
          maxLength={2500}
          className="mt-2 font-mono text-xs"
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
          className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
export function EmbedSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Website embed</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(snippet);
              setCopied(true);
              setCopyError(false);
            } catch {
              setCopied(false);
              setCopyError(true);
            }
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy snippet"}
        </Button>
      </div>
      {copyError && (
        <p role="status" className="mt-2 text-xs text-amber-800">
          Copy is unavailable. Select and copy the snippet below.
        </p>
      )}
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/50 p-4 text-[11px] leading-6">
        <code>{snippet}</code>
      </pre>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Add this before your website’s closing body tag. Visitors can chat
        without an Avenlyo account.
      </p>
    </div>
  );
}
export function DisconnectInstagram({ editable }: { editable: boolean }) {
  const [state, action, pending] = useActionState(disconnectInstagram, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <details className="mt-5">
      <summary className="text-xs text-muted-foreground hover:text-red-700">
        Disconnect Instagram…
      </summary>
      <form
        action={action}
        className="mt-3 rounded-lg border border-red-100 bg-red-50 p-4"
      >
        <p className="mb-3 text-xs leading-6 text-red-800">
          Disconnect this account? New Instagram messages will stop reaching
          this workspace.
        </p>
        <Button size="sm" variant="outline" disabled={!editable || pending}>
          Confirm disconnect
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
    </details>
  );
}
