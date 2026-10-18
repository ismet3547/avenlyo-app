export function dateLabel(value: string, full = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(
    "en",
    full
      ? { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }
      : { month: "short", day: "numeric", timeZone: "UTC" },
  ).format(date);
}
export function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}
export const qualificationLabel = {
  qualified: "Qualified",
  needs_info: "Needs details",
  needs_human: "Needs your help",
} as const;
export function screenHref(path: string, preview = false) {
  return preview ? `/preview?screen=${encodeURIComponent(path)}` : path;
}
