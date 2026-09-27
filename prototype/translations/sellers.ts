import type { Translation } from "./types";

export const sellersTranslations: Record<string, Translation> = {
  title: { en: "Sellers", fr: "Vendeurs" },
  description: {
    en: "Monthly sales and commission earned by each employee.",
    fr: "Ventes et commission mensuelles de chaque employé.",
  },
  sold: { en: "Sold", fr: "Total vendu" },
  commission: { en: "Commission", fr: "Commission" },
  sales: { en: "sales", fr: "ventes" },
  empty: { en: "No sale yet.", fr: "Aucune vente pour le moment." },
};
