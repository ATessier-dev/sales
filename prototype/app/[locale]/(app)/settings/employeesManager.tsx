"use client";

import { useState } from "react";
import { Plus, Pencil, Users } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, employeesTranslations, type Language } from "@/translations";
import { EmployeeForm, type EmployeeEntry } from "./editEmployee";

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

  function handleSaved() {
    setFormMode(null);
    onChanged();
  }

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
          <Button size="sm" onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(employeesTranslations.addEmployee, language)}
          </Button>
        }
      />

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
                <CardTitle className="flex items-center gap-2 text-sm">
                  {employee.firstName} {employee.lastName}
                  {!employee.active && <span className="text-xs font-normal text-muted-foreground">inactif</span>}
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
