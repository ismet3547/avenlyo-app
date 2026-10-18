import {
  BriefcaseBusiness,
  Banknote,
  CircleHelp,
  ShieldCheck,
  Building2,
  NotebookPen,
  ArrowUpRight,
} from "lucide-react";
import {
  knowledgeLabels,
  knowledgeTypes,
  type KnowledgeType,
} from "@avenlyo-app/shared";
export const knowledgeDescriptions: Record<KnowledgeType, string> = {
  service: "What you offer.",
  pricing: "Prices, packages and conditions.",
  faq: "Common customer questions.",
  policy: "Rules, limits and business policies.",
  business_info: "Company, contact and operating information.",
  custom_note: "Anything else customers should know.",
};
const icons = {
  service: BriefcaseBusiness,
  pricing: Banknote,
  faq: CircleHelp,
  policy: ShieldCheck,
  business_info: Building2,
  custom_note: NotebookPen,
};
export function KnowledgeIcon({ type }: { type: KnowledgeType }) {
  const Icon = icons[type];
  return <Icon aria-hidden className="size-5" />;
}
export function KnowledgeTypeChoices({
  selected,
  onChange,
}: {
  selected?: KnowledgeType;
  onChange?: (type: KnowledgeType) => void;
}) {
  return (
    <div className="knowledge-type-grid">
      {knowledgeTypes.map((type) =>
        onChange ? (
          <label key={type} className="knowledge-type-choice">
            <input
              type="radio"
              name="type"
              value={type}
              checked={selected === type}
              onChange={() => onChange(type)}
              aria-label={knowledgeLabels[type]}
            />
            <KnowledgeIcon type={type} />
            <span>
              <strong>{knowledgeLabels[type]}</strong>
              <span>{knowledgeDescriptions[type]}</span>
            </span>
          </label>
        ) : (
          <a
            className="knowledge-type-choice"
            key={type}
            href={`/app/knowledge/new?type=${type}`}
          >
            <KnowledgeIcon type={type} />
            <span>
              <strong>{knowledgeLabels[type]}</strong>
              <span>{knowledgeDescriptions[type]}</span>
            </span>
            <ArrowUpRight aria-hidden className="ml-auto size-4" />
          </a>
        ),
      )}
    </div>
  );
}
