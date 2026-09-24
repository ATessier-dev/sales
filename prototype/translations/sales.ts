import type { Translation } from "./types";

export const salesTranslations: Record<string, Translation> = {
  title: { en: "Sales", fr: "Ventes" },
  description: {
    en: "Sales history and totals",
    fr: "Historique des ventes et totaux",
  },
  today: { en: "Today", fr: "Aujourd'hui" },
  thisWeek: { en: "This week", fr: "Cette semaine" },
  thisMonth: { en: "This month", fr: "Ce mois-ci" },
  thisYear: { en: "This year", fr: "Cette année" },
  all: { en: "All", fr: "Tout" },
  totalForPeriod: { en: "Total for period", fr: "Total pour la période" },
  saleCount: { en: "Sales", fr: "Ventes" },
  empty: { en: "No sale for this period.", fr: "Aucune vente pour cette période." },
  employee: { en: "Employee", fr: "Employé" },
  paymentMethod: { en: "Payment", fr: "Paiement" },
  items: { en: "Items", fr: "Articles" },
  commission: { en: "Commission", fr: "Commission" },
  delivery: { en: "Delivery", fr: "Livraison" },
  date: { en: "Date", fr: "Date" },
};
