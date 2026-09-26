import type { Translation } from "./types";

export const categoriesTranslations: Record<string, Translation> = {
  title: { en: "Categories", fr: "Catégories" },
  addCategory: { en: "Add category", fr: "Ajouter une catégorie" },
  editCategory: { en: "Edit", fr: "Modifier" },
  deleteCategory: { en: "Delete", fr: "Supprimer" },
  nameLabel: { en: "Name", fr: "Nom" },
  activeLabel: { en: "Active", fr: "Actif" },
  empty: { en: "No category yet.", fr: "Aucune catégorie pour le moment." },
  cancel: { en: "Cancel", fr: "Annuler" },
  save: { en: "Save", fr: "Enregistrer" },
  saveError: { en: "Could not save, please try again.", fr: "Impossible d'enregistrer, réessayez." },
};
