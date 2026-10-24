"use client";
import { useActionState, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { FormState } from "@/app/auth/actions";
import {
  saveWebsiteChannel,
  disconnectInstagram,
} from "@/app/app/channels/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { FormFeedback } from "./form-feedback";
import { ConfirmButton } from "./confirm-button";
export function WebsiteChannelForm({
  enabled,
  origins,
  editable,
  workspaceId,
}: {
  enabled: boolean;
  origins: string[];
  editable: boolean;
  workspaceId: string;
}) {
  const [state, action, pending] = useActionState(saveWebsiteChannel, {
    message: "",
    status: "idle",
  } as FormState);
  const [changed, setChanged] = useState(false);
  const [isEnabled, setEnabled] = useState(enabled);
  const [originText, setOriginText] = useState(origins.join("\n"));
  return (
    <form
      action={action}
      onChange={() => setChanged(true)}
      onSubmit={() => setChanged(false)}
      className="mt-6 space-y-5"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          name="enabled"
          checked={isEnabled}
          onChange={(event) => setEnabled(event.target.checked)}
          disabled={!editable || pending}
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
          value={originText}
          onChange={(event) => setOriginText(event.target.value)}
          disabled={!editable || pending}
          required
          aria-describedby="website-origins-help"
          rows={3}
          placeholder={"https://example.com\nhttps://www.example.com"}
          maxLength={2500}
          className="mt-2 font-mono text-xs"
        />
        <p
          id="website-origins-help"
          className="mt-2 text-xs leading-5 text-muted-foreground"
        >
          One exact origin per line. Include https:// and each www variant you
          use. No paths or wildcards.
        </p>
      </div>
      {!editable && (
        <p className="text-xs leading-5 text-muted-foreground">
          Only workspace owners can change channel settings.
        </p>
      )}
      {!isEnabled && enabled && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Saving will stop new visitor sessions and access to existing website
          chats until you enable this channel again.
        </p>
      )}
      <Button type="submit" size="sm" disabled={!editable || pending}>
        {pending ? "Saving…" : "Save Website Chat"}
      </Button>
      {changed && !pending && (
        <p className="text-xs font-medium text-amber-900">Unsaved changes</p>
      )}
      <FormFeedback
        state={
          (changed && state.status === "success") || pending
            ? { status: "idle", message: "" }
            : state
        }
      />
    </form>
  );
}
export function EmbedSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  return (
    <div className="mt-6 border-t border-border pt-5">
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
        <div className="mt-3">
          <p role="alert" className="mb-2 text-xs leading-5 text-amber-900">
            Automatic copying is unavailable. Select and copy the code below.
          </p>
          <Textarea
            aria-label="Website embed code"
            readOnly
            value={snippet}
            onFocus={(event) => event.currentTarget.select()}
            className="font-mono text-xs"
          />
        </div>
      )}
      {copied && (
        <p role="status" className="sr-only">
          Embed code copied.
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
export function DisconnectInstagram({
  editable,
  workspaceId,
}: {
  editable: boolean;
  workspaceId: string;
}) {
  const [state, action, pending] = useActionState(disconnectInstagram, {
    message: "",
    status: "idle",
  } as FormState);
  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <ConfirmButton
        size="sm"
        variant="destructive"
        name="intent"
        value="disconnect"
        disabled={!editable || pending}
        title="Disconnect Instagram?"
        description="This stops Instagram messaging for this workspace and removes its stored access token. Existing conversations remain available. Reconnecting requires your Avenlyo operator."
        confirmLabel="Disconnect Instagram"
      >
        {pending ? "Disconnecting…" : "Disconnect Instagram"}
      </ConfirmButton>
      <FormFeedback state={state} className="mt-3" />
    </form>
  );
}
