"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, categoriesTranslations, type Language } from "@/translations";
import { useSuperuserFetch } from "@/lib/superuserCodeContext";

export type CategoryEntry = {
  id: string;
  name: string;
  active: boolean;
};

export function CategoryForm({
  language,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: CategoryEntry;
  onCancel: () => void;
  onSaved: (category: CategoryEntry) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [active, setActive] = useState(initialValues?.active ?? true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const superuserFetch = useSuperuserFetch();

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await superuserFetch(isEditing ? `/api/categories/${initialValues!.id}` : "/api/categories", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const data = (await response.json()) as { category: CategoryEntry };
    onSaved(data.category);
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(false);

    const response = await superuserFetch(`/api/categories/${initialValues.id}`, { method: "DELETE" });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    onDeleted();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="category-name">{getTranslation(categoriesTranslations.nameLabel, language)}</Label>
        <Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
      </div>

      {isEditing && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          {getTranslation(categoriesTranslations.activeLabel, language)}
        </label>
      )}

      {error && <p className="text-xs text-destructive">{getTranslation(categoriesTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(categoriesTranslations.deleteCategory, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(categoriesTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(categoriesTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
