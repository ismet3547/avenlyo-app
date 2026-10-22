import type { Agent, ChannelConnection, Language } from "@avenlyo-app/shared";
import { languages } from "@avenlyo-app/shared";
import { channelIsActive, channelHasIssue } from "./home-model";
export function agentStatus(channels: ChannelConnection[]) {
  if (channels.some(channelHasIssue)) return "Issue";
  if (channels.some(channelIsActive)) return "Live";
  return "Ready";
}
export function agentLanguageSummary(
  agent: Pick<
    Agent,
    "primary_language" | "additional_languages" | "language_policy"
  >,
) {
  if (agent.language_policy === "legacy_multilingual")
    return `${languages[agent.primary_language as Language] ?? agent.primary_language} · Multilingual`;
  const selected = [agent.primary_language, ...agent.additional_languages].map(
    (code) => languages[code as Language] ?? code,
  );
  return selected.length > 3
    ? `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`
    : selected.join(", ");
}
export const handlingLabels = {
  answer_questions: "Answer customer questions",
  identify_interest: "Understand customer needs",
  qualify_inquiries: "Qualify inquiries",
  collect_contact: "Collect contact details",
} as const;
