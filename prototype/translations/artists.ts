import type { Translation } from "./types";

export const artistsTranslations: Record<string, Translation> = {
  title: { en: "Artists", fr: "Artistes" },
  addArtist: { en: "Add artist", fr: "Ajouter un artiste" },
  editArtist: { en: "Edit", fr: "Modifier" },
  deleteArtist: { en: "Delete", fr: "Supprimer" },
  nameLabel: { en: "Name", fr: "Nom" },
  commissionRateLabel: { en: "Commission rate (%)", fr: "Taux de commission (%)" },
  activeLabel: { en: "Active", fr: "Actif" },
  empty: { en: "No artist yet.", fr: "Aucun artiste pour le moment." },
  cancel: { en: "Cancel", fr: "Annuler" },
  save: { en: "Save", fr: "Enregistrer" },
  saveError: { en: "Could not save, please try again.", fr: "Impossible d'enregistrer, réessayez." },
};
