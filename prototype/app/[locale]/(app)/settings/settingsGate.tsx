"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, settingsTranslations, type Language } from "@/translations";
import { SuperuserCodeProvider } from "@/lib/superuserCodeContext";
import { CommissionsManager } from "./commissionsManager";
import { EmployeesManager } from "./employeesManager";
import { TaxRatesManager, type TaxRatesEntry } from "./taxRatesManager";
import type { CommissionEntry } from "./editCommission";
import type { EmployeeEntry } from "./editEmployee";

type SettingsData = {
  commissions: CommissionEntry[];
  employees: EmployeeEntry[];
  taxRates: TaxRatesEntry;
};

async function unlockSuperuser(code: string): Promise<void> {
  const response = await fetch("/api/auth/superuser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new Error("invalid_code");
}

async function fetchSettingsData(code: string): Promise<SettingsData> {
  const headers = { "x-superuser-code": code };
  const [commissionsRes, employeesRes, taxRatesRes] = await Promise.all([
    fetch("/api/commissions", { headers }),
    fetch("/api/employees", { headers }),
    fetch("/api/tax-rates", { headers }),
  ]);

  if (!commissionsRes.ok || !employeesRes.ok || !taxRatesRes.ok) {
    throw new Error("fetch_failed");
  }

  const [commissionsJson, employeesJson, taxRatesJson] = await Promise.all([
    commissionsRes.json(),
    employeesRes.json(),
    taxRatesRes.json(),
  ]);

  return {
    commissions: commissionsJson.commissions.map(
      (commission: { id: string; title: string; rate: string; active: boolean }) => ({
        id: commission.id,
        title: commission.title,
        rate: Number(commission.rate),
        active: commission.active,
      })
    ),
    employees: employeesJson.employees.map(
      (employee: {
        id: string;
        firstName: string;
        lastName: string;
        active: boolean;
        commissionRate: string;
        externalId: string | null;
      }) => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        active: employee.active,
        commissionRate: Number(employee.commissionRate),
        externalId: employee.externalId,
      })
    ),
    taxRates: {
      gstRate: Number(taxRatesJson.taxRate.gstRate),
      qstRate: Number(taxRatesJson.taxRate.qstRate),
    },
  };
}

export function SettingsGate({ language }: { language: Language }) {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState<string | null>(null);

  const unlockMutation = useMutation({ mutationFn: unlockSuperuser });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    unlockMutation.mutate(code, { onSuccess: () => setUnlocked(code) });
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>{getTranslation(settingsTranslations.codeTitle, language)}</CardTitle>
            <CardDescription>{getTranslation(settingsTranslations.codeSubtitle, language)}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="superuser-code">{getTranslation(settingsTranslations.codeLabel, language)}</Label>
                <Input
                  id="superuser-code"
                  type="password"
                  autoFocus
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>
              {unlockMutation.isError && (
                <p className="text-sm text-destructive">{getTranslation(settingsTranslations.invalidCode, language)}</p>
              )}
              <Button type="submit" disabled={unlockMutation.isPending || !code} className="w-full">
                {getTranslation(settingsTranslations.unlock, language)}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <SettingsContent language={language} code={unlocked} />;
}

function SettingsContent({ language, code }: { language: Language; code: string }) {
  const query = useQuery({
    queryKey: ["settings-data", code],
    queryFn: () => fetchSettingsData(code),
  });

  if (query.isPending) {
    return <p className="p-4 text-sm text-muted-foreground">{getTranslation(settingsTranslations.loading, language)}</p>;
  }

  if (query.isError || !query.data) {
    return <p className="p-4 text-sm text-destructive">{getTranslation(settingsTranslations.loadError, language)}</p>;
  }

  const { commissions, employees, taxRates } = query.data;

  return (
    <SuperuserCodeProvider value={code}>
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 p-4">
        <EmployeesManager language={language} employees={employees} onChanged={query.refetch} />
        <CommissionsManager language={language} commissions={commissions} onChanged={query.refetch} />
        <TaxRatesManager language={language} taxRates={taxRates} onChanged={query.refetch} />
      </main>
    </SuperuserCodeProvider>
  );
}
