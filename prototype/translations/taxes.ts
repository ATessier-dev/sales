import type { Translation } from "./types";

export const taxesTranslations: Record<string, Translation> = {
  title: { en: "Taxes", fr: "Taxes" },
  gstLabel: { en: "GST rate (%)", fr: "Taux TPS (%)" },
  qstLabel: { en: "QST rate (%)", fr: "Taux TVQ (%)" },
  save: { en: "Save", fr: "Enregistrer" },
  saveError: { en: "Could not save, please try again.", fr: "Impossible d'enregistrer, réessayez." },
};
