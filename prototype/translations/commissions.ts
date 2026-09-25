import type { Translation } from "./types";

export const commissionsTranslations: Record<string, Translation> = {
  title: { en: "Commissions", fr: "Commissions" },
  addCommission: { en: "Add commission", fr: "Ajouter une commission" },
  editCommission: { en: "Edit", fr: "Modifier" },
  deleteCommission: { en: "Delete", fr: "Supprimer" },
  titleLabel: { en: "Title", fr: "Titre" },
  rateLabel: { en: "Rate (%)", fr: "Taux (%)" },
  activeLabel: { en: "Active", fr: "Actif" },
  empty: { en: "No commission yet.", fr: "Aucune commission pour le moment." },
  cancel: { en: "Cancel", fr: "Annuler" },
  save: { en: "Save", fr: "Enregistrer" },
  saveError: { en: "Could not save, please try again.", fr: "Impossible d'enregistrer, réessayez." },
};
