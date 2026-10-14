import {
  type AgentSettings,
  type LeadCandidate,
  type ModelResponse,
} from "@avenlyo-app/shared";

const decline =
  /\b(not interested|just browsing|no thanks|do not contact|don't contact)\b|ilgilenmiyorum|istemiyorum|sadece bakıyorum/iu;
export function commercialEvidence(
  customerTurns: readonly string[],
): string | null {
  if (decline.test(customerTurns.at(-1) ?? "")) return null;
  const context = customerTurns.join("\n");
  if (
    !/\b(services?|projects?|design|manufactur\w*|quotes?|consultation|repair|restoration|orders?)\b|hizmet|proje|tasarım|üretim|teklif|onarım/iu.test(
      context,
    )
  )
    return null;
  return (
    [...customerTurns]
      .reverse()
      .find(
        (text) =>
          !decline.test(text) &&
          /\b(interested (in|to)|looking for|would like|i('d| would) like|i (want|need)|can (you|we) (discuss|start)|request (a )?quote)\b|ilgileniyorum|teklif (almak|istiyorum)|hizmet almak|proje.*istiyorum/iu.test(
            text,
          ),
      ) ?? null
  );
}
function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function statedName(value: string | null, evidence: string): string | null {
  if (!value) return null;
  return new RegExp(
    `(?:my name is|i am|i'm|name\\s*:|adım|ismim)\\s+${escape(value)}(?=$|[\\s.,!;])`,
    "iu",
  ).test(evidence)
    ? value
    : null;
}
function statedCompany(value: string | null, evidence: string): string | null {
  if (!value) return null;
  return new RegExp(
    `(?:company is|company\\s*:|work (?:at|for)|şirketim|firmam)\\s+${escape(value)}(?=$|[\\s.,!;])`,
    "iu",
  ).test(evidence)
    ? value
    : null;
}
export function validatedLead(
  settings: AgentSettings,
  customerTurns: readonly string[],
  output: ModelResponse,
  human: boolean,
): LeadCandidate | null {
  if (
    !settings.goals.includes("identify_interest") ||
    !settings.goals.includes("collect_contact")
  )
    return null;
  const interest = commercialEvidence(customerTurns);
  if (!interest || output.interest === "declined") return null;
  const evidence = customerTurns.join("\n");
  const emails =
    evidence.match(
      /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+/giu,
    ) ?? [];
  const email =
    output.email &&
    emails.some((e) => e.toLowerCase() === output.email?.toLowerCase())
      ? output.email
      : null;
  const digits = (s: string) => s.replace(/\D/g, "");
  const phone = output.phone
    ? ((evidence.match(/\+?\d[\d() .-]{5,}\d/g) ?? []).find(
        (p) => digits(p) === digits(output.phone ?? ""),
      ) ?? null)
    : null;
  const name = statedName(output.name, evidence);
  const company = statedCompany(output.company, evidence);
  const facts = { name, email, phone, company };
  // Collect only the business-selected fields; no arbitrary model payload crosses this boundary.
  for (const key of ["name", "email", "phone", "company"] as const)
    if (!settings.contact_fields.includes(key)) facts[key] = null;
  if (!Object.values(facts).some(Boolean)) return null;
  const complete = settings.contact_fields.every((key) => Boolean(facts[key]));
  const qualification = human
    ? "needs_human"
    : complete && settings.goals.includes("qualify_inquiries")
      ? "qualified"
      : "needs_info";
  return {
    ...facts,
    intent: "service_inquiry",
    qualification,
    summary: `Service inquiry: ${interest.replace(/\s+/g, " ").slice(0, 360)}${complete ? " Required contact details provided." : " Further contact details needed."}`,
  };
}
