"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, commissionsTranslations, type Language } from "@/translations";
import { CommissionForm, type CommissionEntry } from "./editCommission";

export function CommissionsManager({
  language,
  commissions,
}: {
  language: Language;
  commissions: CommissionEntry[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | CommissionEntry | null>(null);

  function handleSaved() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(commissionsTranslations.title, language)}
          </span>
        }
        actions={
          <Button size="sm" onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(commissionsTranslations.addCommission, language)}
          </Button>
        }
      />

      {formMode && (
        <CommissionForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {commissions.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(commissionsTranslations.empty, language)}</p>
        ) : (
          commissions.map((commission) => (
            <Card key={commission.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {commission.title}
                  <span className="text-xs font-normal text-muted-foreground">
                    {commission.rate}%{!commission.active ? " · inactif" : ""}
                  </span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setFormMode(commission)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {getTranslation(commissionsTranslations.editCommission, language)}
                </Button>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
