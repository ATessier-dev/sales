"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, employeesTranslations, type Language } from "@/translations";
import { useSuperuserFetch } from "@/lib/superuserCodeContext";

export type EmployeeEntry = {
  id: string;
  firstName: string;
  lastName: string;
  active: boolean;
};

export function EmployeeForm({
  language,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: EmployeeEntry;
  onCancel: () => void;
  onSaved: (employee: EmployeeEntry) => void;
  onDeleted: () => void;
}) {
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [active, setActive] = useState(initialValues?.active ?? true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const superuserFetch = useSuperuserFetch();

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await superuserFetch(isEditing ? `/api/employees/${initialValues!.id}` : "/api/employees", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, active }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const data = (await response.json()) as { employee: EmployeeEntry };
    onSaved(data.employee);
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(false);

    const response = await superuserFetch(`/api/employees/${initialValues.id}`, { method: "DELETE" });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    onDeleted();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="employee-first-name">{getTranslation(employeesTranslations.firstNameLabel, language)}</Label>
          <Input
            id="employee-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="employee-last-name">{getTranslation(employeesTranslations.lastNameLabel, language)}</Label>
          <Input
            id="employee-last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>
      </div>

      {isEditing && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          {getTranslation(employeesTranslations.activeLabel, language)}
        </label>
      )}

      {error && <p className="text-xs text-destructive">{getTranslation(employeesTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(employeesTranslations.deleteEmployee, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(employeesTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(employeesTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
