"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, artistsTranslations, type Language } from "@/translations";

export type ArtistEntry = {
  id: string;
  name: string;
  active: boolean;
};

export function ArtistForm({
  language,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: ArtistEntry;
  onCancel: () => void;
  onSaved: (artist: ArtistEntry) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [active, setActive] = useState(initialValues?.active ?? true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/artists/${initialValues!.id}` : "/api/artists", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const data = (await response.json()) as { artist: ArtistEntry };
    onSaved(data.artist);
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(false);

    const response = await fetch(`/api/artists/${initialValues.id}`, { method: "DELETE" });

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
        <Label htmlFor="artist-name">{getTranslation(artistsTranslations.nameLabel, language)}</Label>
        <Input id="artist-name" value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
      </div>

      {isEditing && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          {getTranslation(artistsTranslations.activeLabel, language)}
        </label>
      )}

      {error && <p className="text-xs text-destructive">{getTranslation(artistsTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(artistsTranslations.deleteArtist, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(artistsTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(artistsTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
