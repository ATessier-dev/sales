export * from "./login";
export * from "./navbar";
export * from "./pos";
export * from "./sales";
export * from "./artists";
export * from "./articles";
export * from "./settings";
export type { Language, Translation } from "./types";

import type { Language, Translation } from "./types";

export const defaultLanguage: Language = "fr";

export function getTranslation(
  translation: Translation | undefined,
  language: Language = defaultLanguage
): string {
  return translation ? translation[language] : "";
}
