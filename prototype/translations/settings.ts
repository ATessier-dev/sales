import type { Translation } from "./types";

export const settingsTranslations: Record<string, Translation> = {
  title: { en: "Settings", fr: "Réglages" },
  codeTitle: { en: "Superuser access", fr: "Accès superviseur" },
  codeSubtitle: {
    en: "Enter the superuser code to access settings. It isn't remembered after you leave this page.",
    fr: "Entrez le code superviseur pour accéder aux réglages. Il n'est pas retenu une fois la page quittée.",
  },
  codeLabel: { en: "Superuser code", fr: "Code superviseur" },
  unlock: { en: "Unlock", fr: "Déverrouiller" },
  invalidCode: { en: "Invalid code", fr: "Code invalide" },
  loadError: { en: "Could not load settings, please try again.", fr: "Impossible de charger les réglages, réessayez." },
  loading: { en: "Loading...", fr: "Chargement..." },
};
