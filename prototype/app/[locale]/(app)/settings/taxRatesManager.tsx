"use client";

import { useState, type FormEvent } from "react";
import { Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, taxesTranslations, type Language } from "@/translations";
import { useSuperuserFetch } from "@/lib/superuserCodeContext";

export type TaxRatesEntry = { gstRate: number; qstRate: number };

export function TaxRatesManager({
  language,
  taxRates,
  onChanged,
}: {
  language: Language;
  taxRates: TaxRatesEntry;
  onChanged: () => void;
}) {
  const [gstRate, setGstRate] = useState(String(taxRates.gstRate));
  const [qstRate, setQstRate] = useState(String(taxRates.qstRate));
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const superuserFetch = useSuperuserFetch();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await superuserFetch("/api/tax-rates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstRate: Number(gstRate), qstRate: Number(qstRate) }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    onChanged();
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(taxesTranslations.title, language)}
          </span>
        }
      />

      <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="gst-rate">{getTranslation(taxesTranslations.gstLabel, language)}</Label>
            <Input
              id="gst-rate"
              type="number"
              min={0}
              max={100}
              step={0.001}
              value={gstRate}
              onChange={(event) => setGstRate(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qst-rate">{getTranslation(taxesTranslations.qstLabel, language)}</Label>
            <Input
              id="qst-rate"
              type="number"
              min={0}
              max={100}
              step={0.001}
              value={qstRate}
              onChange={(event) => setQstRate(event.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{getTranslation(taxesTranslations.saveError, language)}</p>}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={submitting}>
            {getTranslation(taxesTranslations.save, language)}
          </Button>
        </div>
      </form>
    </div>
  );
}
