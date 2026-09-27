export * from "./navbar";
export * from "./pos";
export * from "./sales";
export * from "./reports";
export * from "./artists";
export * from "./articles";
export * from "./commissions";
export * from "./categories";
export * from "./employees";
export * from "./sellers";
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
