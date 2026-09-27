"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Users, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, employeesTranslations, type Language } from "@/translations";
import { useSuperuserFetch } from "@/lib/superuserCodeContext";
import { EmployeeForm, type EmployeeEntry } from "./editEmployee";

type ImportResult = { created: number; updated: number };

export function EmployeesManager({
  language,
  employees,
  onChanged,
}: {
  language: Language;
  employees: EmployeeEntry[];
  onChanged: () => void;
}) {
  const [formMode, setFormMode] = useState<"create" | EmployeeEntry | null>(null);
  const superuserFetch = useSuperuserFetch();

  function handleSaved() {
    setFormMode(null);
    onChanged();
  }

  const importMutation = useMutation({
    mutationFn: async (): Promise<ImportResult> => {
      const response = await superuserFetch("/api/employees/import", { method: "POST" });
      if (!response.ok) throw new Error("import_failed");
      return response.json();
    },
    onSuccess: onChanged,
  });

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(employeesTranslations.title, language)}
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {getTranslation(employeesTranslations.refresh, language)}
            </Button>
            <Button size="sm" onClick={() => setFormMode("create")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {getTranslation(employeesTranslations.addEmployee, language)}
            </Button>
          </div>
        }
      />

      {importMutation.isError && (
        <p className="text-xs text-destructive">{getTranslation(employeesTranslations.importError, language)}</p>
      )}
      {importMutation.isSuccess && (
        <p className="text-xs text-muted-foreground">
          {getTranslation(employeesTranslations.importSuccess, language)
            .replace("{created}", String(importMutation.data.created))
            .replace("{updated}", String(importMutation.data.updated))}
        </p>
      )}

      {formMode && (
        <EmployeeForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {employees.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(employeesTranslations.empty, language)}</p>
        ) : (
          employees.map((employee) => (
            <Card key={employee.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex flex-col gap-0.5 text-sm">
                  <span>
                    {employee.firstName} {employee.lastName}
                    {!employee.active ? " · inactif" : ""}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {employee.commissionRate}%{employee.externalId ? " · clockin" : ""}
                  </span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setFormMode(employee)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {getTranslation(employeesTranslations.editEmployee, language)}
                </Button>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
