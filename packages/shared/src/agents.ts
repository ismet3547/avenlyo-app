import { z } from "zod";
import { agentSettingsSchema } from "./schemas.ts";

export const languages = {
  en: "English",
  tr: "Turkish",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ar: "Arabic",
  ru: "Russian",
  uk: "Ukrainian",
  pl: "Polish",
  ro: "Romanian",
  el: "Greek",
  bg: "Bulgarian",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  cs: "Czech",
  hu: "Hungarian",
  he: "Hebrew",
  hi: "Hindi",
  bn: "Bengali",
  ur: "Urdu",
  fa: "Persian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  id: "Indonesian",
  ms: "Malay",
  vi: "Vietnamese",
  th: "Thai",
  sw: "Swahili",
  af: "Afrikaans",
  sr: "Serbian",
  hr: "Croatian",
  sk: "Slovak",
  sl: "Slovenian",
  lt: "Lithuanian",
  lv: "Latvian",
  et: "Estonian",
  ca: "Catalan",
  fil: "Filipino",
} as const;
export type Language = keyof typeof languages;
export const languageCodes = Object.keys(languages) as [
  Language,
  ...Language[],
];
export const languageSchema = z.enum(languageCodes);
export const agentIdentitySchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    setup_brief: z.string().trim().min(3).max(1500),
    primary_language: languageSchema,
  })
  .strict();
export const agentLanguagesSchema = z
  .object({
    primary_language: languageSchema,
    additional_languages: z.array(languageSchema).max(43),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.additional_languages.includes(value.primary_language) ||
      new Set(value.additional_languages).size !==
        value.additional_languages.length
    )
      ctx.addIssue({ code: "custom", message: "Choose each language once." });
  });
export const agentBehaviorSchema = agentSettingsSchema;
export const agentScopeSchema = z
  .object({
    mode: z.enum(["all", "selected"]),
    item_ids: z.array(z.uuid()).max(500),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.item_ids).size !== value.item_ids.length)
      ctx.addIssue({ code: "custom", message: "Select each item once." });
    if (value.mode === "all" && value.item_ids.length)
      ctx.addIssue({
        code: "custom",
        message: "All published knowledge needs no item selection.",
      });
  });
