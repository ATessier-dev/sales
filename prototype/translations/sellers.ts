import type { Translation } from "./types";

export const sellersTranslations: Record<string, Translation> = {
  title: { en: "Sellers", fr: "Vendeurs" },
  description: {
    en: "Monthly commission earned by each employee.",
    fr: "Commission mensuelle gagnée par chaque employé.",
  },
  total: { en: "Total", fr: "Total" },
  sales: { en: "sales", fr: "ventes" },
  empty: { en: "No sale yet.", fr: "Aucune vente pour le moment." },
};
