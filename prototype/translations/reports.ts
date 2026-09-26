import type { Translation } from "./types";

export const reportsTranslations: Record<string, Translation> = {
  title: { en: "Reports", fr: "Rapports" },
  description: {
    en: "Sales by artist, with every sold article",
    fr: "Ventes par artiste, avec chaque article vendu",
  },
  totalSales: { en: "Total sales", fr: "Total des ventes" },
  totalCommission: { en: "Total commission", fr: "Total des commissions" },
  itemsSold: { en: "Items sold", fr: "Articles vendus" },
  empty: { en: "No sale for this period.", fr: "Aucune vente pour cette période." },
};
