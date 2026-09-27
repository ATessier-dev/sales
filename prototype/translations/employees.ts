import type { Translation } from "./types";

export const employeesTranslations: Record<string, Translation> = {
  title: { en: "Employees", fr: "Employés" },
  addEmployee: { en: "Add employee", fr: "Ajouter un employé" },
  editEmployee: { en: "Edit", fr: "Modifier" },
  deleteEmployee: { en: "Delete", fr: "Supprimer" },
  firstNameLabel: { en: "First name", fr: "Prénom" },
  lastNameLabel: { en: "Last name", fr: "Nom" },
  commissionRateLabel: { en: "Commission rate (%)", fr: "Taux de commission (%)" },
  activeLabel: { en: "Active", fr: "Actif" },
  importedBadge: { en: "Imported from clockin.", fr: "Importé depuis clockin." },
  refresh: { en: "Refresh", fr: "Actualiser" },
  importError: { en: "Could not import employees, please try again.", fr: "Impossible d'importer les employés, réessayez." },
  importSuccess: {
    en: "{created} added, {updated} updated.",
    fr: "{created} ajouté(s), {updated} mis à jour.",
  },
  empty: { en: "No employee yet.", fr: "Aucun employé pour le moment." },
  cancel: { en: "Cancel", fr: "Annuler" },
  save: { en: "Save", fr: "Enregistrer" },
  saveError: { en: "Could not save, please try again.", fr: "Impossible d'enregistrer, réessayez." },
};
