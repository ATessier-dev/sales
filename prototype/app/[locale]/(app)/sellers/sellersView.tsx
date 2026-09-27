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
  soldAmount: number;
  commissionAmount: number;
};

type MonthGroup = { key: string; label: string; soldTotal: number; commissionTotal: number; saleCount: number };
type EmployeeGroup = {
  employeeId: string;
  employeeName: string;
  soldTotal: number;
  commissionTotal: number;
  months: MonthGroup[];
};

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
        employeeGroup = {
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          soldTotal: 0,
          commissionTotal: 0,
          months: [],
        };
        byEmployee.set(item.employeeId, employeeGroup);
      }
      employeeGroup.soldTotal += item.soldAmount;
      employeeGroup.commissionTotal += item.commissionAmount;

      let month = employeeGroup.months.find((m) => m.key === key);
      if (!month) {
        month = { key, label, soldTotal: 0, commissionTotal: 0, saleCount: 0 };
        employeeGroup.months.push(month);
      }
      month.soldTotal += item.soldAmount;
      month.commissionTotal += item.commissionAmount;
      month.saleCount += 1;
    }

    for (const employeeGroup of byEmployee.values()) {
      employeeGroup.months.sort((a, b) => (a.key < b.key ? 1 : -1));
    }

    return Array.from(byEmployee.values()).sort((a, b) => b.soldTotal - a.soldTotal);
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
                <div className="text-right text-sm">
                  <div className="font-semibold">
                    {getTranslation(sellersTranslations.sold, language)}: {employeeGroup.soldTotal.toFixed(2)} $
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getTranslation(sellersTranslations.commission, language)}: {employeeGroup.commissionTotal.toFixed(2)} $
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm">
                  {employeeGroup.months.map((month) => (
                    <li key={month.key} className="flex justify-between gap-2">
                      <span className="capitalize text-muted-foreground">
                        {month.label}
                        <span className="ml-2 text-xs">
                          ({month.saleCount} {getTranslation(sellersTranslations.sales, language)})
                        </span>
                      </span>
                      <div className="text-right">
                        <div className="font-medium text-foreground">{month.soldTotal.toFixed(2)} $</div>
                        <div className="text-xs text-muted-foreground">
                          {getTranslation(sellersTranslations.commission, language)}: {month.commissionTotal.toFixed(2)} $
                        </div>
                      </div>
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
