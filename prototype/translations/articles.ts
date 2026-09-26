import type { Translation } from "./types";

export const articlesTranslations: Record<string, Translation> = {
  title: { en: "Articles", fr: "Articles" },
  addArticle: { en: "Add article", fr: "Ajouter un article" },
  editArticle: { en: "Edit", fr: "Modifier" },
  deleteArticle: { en: "Delete", fr: "Supprimer" },
  titleLabel: { en: "Title", fr: "Titre" },
  categoryLabel: { en: "Category", fr: "Catégorie" },
  noCategory: { en: "No category", fr: "Aucune catégorie" },
  priceLabel: { en: "Price ($)", fr: "Prix ($)" },
  imageLabel: { en: "Image", fr: "Image" },
  removeImage: { en: "Remove image", fr: "Retirer l'image" },
  artistLabel: { en: "Artist", fr: "Artiste" },
  noArtist: { en: "No artist", fr: "Aucun artiste" },
  taxableLabel: { en: "Taxable", fr: "Taxable" },
  activeLabel: { en: "Active", fr: "Actif" },
  empty: { en: "No article yet.", fr: "Aucun article pour le moment." },
  cancel: { en: "Cancel", fr: "Annuler" },
  save: { en: "Save", fr: "Enregistrer" },
  saveError: { en: "Could not save, please try again.", fr: "Impossible d'enregistrer, réessayez." },
};
