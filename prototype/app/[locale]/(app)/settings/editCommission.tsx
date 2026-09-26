"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, commissionsTranslations, type Language } from "@/translations";

export type CommissionEntry = {
  id: string;
  title: string;
  rate: number;
  active: boolean;
};

export function CommissionForm({
  language,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: CommissionEntry;
  onCancel: () => void;
  onSaved: (commission: CommissionEntry) => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [rate, setRate] = useState(String(initialValues?.rate ?? "30"));
  const [active, setActive] = useState(initialValues?.active ?? true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/commissions/${initialValues!.id}` : "/api/commissions", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, rate: Number(rate), active }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const data = (await response.json()) as { commission: CommissionEntry };
    onSaved(data.commission);
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(false);

    const response = await fetch(`/api/commissions/${initialValues.id}`, { method: "DELETE" });

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
        <Label htmlFor="commission-title">{getTranslation(commissionsTranslations.titleLabel, language)}</Label>
        <Input id="commission-title" value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
      </div>

      <div className="space-y-1">
        <Label htmlFor="commission-rate">{getTranslation(commissionsTranslations.rateLabel, language)}</Label>
        <Input
          id="commission-rate"
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          required
        />
      </div>

      {isEditing && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          {getTranslation(commissionsTranslations.activeLabel, language)}
        </label>
      )}

      {error && <p className="text-xs text-destructive">{getTranslation(commissionsTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(commissionsTranslations.deleteCommission, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(commissionsTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(commissionsTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
