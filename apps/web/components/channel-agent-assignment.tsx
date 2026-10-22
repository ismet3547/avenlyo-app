"use client";
import { useActionState } from "react";
import { assignChannelAgent } from "@/app/app/channels/actions";
import { Button, Notice } from "./ui";
export function ChannelAgentAssignment({
  channel,
  agents,
  editable,
}: {
  channel: { id: string; agent_id: string };
  agents: { id: string; name: string }[];
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(assignChannelAgent, {
    status: "idle" as const,
    message: "",
  });
  return (
    <form action={action} className="panel-body stack">
      <input type="hidden" name="connection_id" value={channel.id} />
      <div className="field">
        <label className="field-label" htmlFor={`channel-agent-${channel.id}`}>
          Agent
        </label>
        <select
          id={`channel-agent-${channel.id}`}
          className="input"
          name="agent_id"
          defaultValue={channel.agent_id}
          disabled={!editable || pending}
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <p className="muted small">
        Assignment changes apply to new conversations.
      </p>
      {editable && (
        <Button variant="secondary" disabled={pending}>
          Save agent
        </Button>
      )}
      {pending && <Notice>Saving agent assignment…</Notice>}
      {!pending && state.status !== "idle" && (
        <Notice error={state.status === "error"}>{state.message}</Notice>
      )}
    </form>
  );
}
