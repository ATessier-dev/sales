"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, sellersTranslations, type Language } from "@/translations";

export type SellerSaleItem = {
  saleId: string;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  commissionAmount: number;
};

type MonthGroup = { key: string; label: string; total: number; saleCount: number };
type EmployeeGroup = { employeeId: string; employeeName: string; total: number; months: MonthGroup[] };

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function SellersView({ language, items }: { language: Language; items: SellerSaleItem[] }) {
  const locale = language === "fr" ? "fr-CA" : "en-CA";

  const groups = useMemo(() => {
    const byEmployee = new Map<string, EmployeeGroup>();

    for (const item of items) {
      const date = new Date(item.createdAt);
      const key = monthKey(date);
      const label = date.toLocaleDateString(locale, { month: "long", year: "numeric" });

      let employeeGroup = byEmployee.get(item.employeeId);
      if (!employeeGroup) {
        employeeGroup = { employeeId: item.employeeId, employeeName: item.employeeName, total: 0, months: [] };
        byEmployee.set(item.employeeId, employeeGroup);
      }
      employeeGroup.total += item.commissionAmount;

      let month = employeeGroup.months.find((m) => m.key === key);
      if (!month) {
        month = { key, label, total: 0, saleCount: 0 };
        employeeGroup.months.push(month);
      }
      month.total += item.commissionAmount;
      month.saleCount += 1;
    }

    for (const employeeGroup of byEmployee.values()) {
      employeeGroup.months.sort((a, b) => (a.key < b.key ? 1 : -1));
    }

    return Array.from(byEmployee.values()).sort((a, b) => b.total - a.total);
  }, [items, locale]);

  return (
    <div className="space-y-4">
      <PageHeading
        title={getTranslation(sellersTranslations.title, language)}
        description={getTranslation(sellersTranslations.description, language)}
      />

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{getTranslation(sellersTranslations.empty, language)}</p>
      ) : (
        <div className="space-y-3">
          {groups.map((employeeGroup) => (
            <Card key={employeeGroup.employeeId}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-sm">{employeeGroup.employeeName}</CardTitle>
                <span className="text-sm font-semibold">
                  {getTranslation(sellersTranslations.total, language)}: {employeeGroup.total.toFixed(2)} $
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1 text-sm">
                  {employeeGroup.months.map((month) => (
                    <li key={month.key} className="flex justify-between gap-2 text-muted-foreground">
                      <span className="capitalize">{month.label}</span>
                      <span>
                        {month.saleCount} {getTranslation(sellersTranslations.sales, language)}
                        {" · "}
                        <span className="font-medium text-foreground">{month.total.toFixed(2)} $</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
