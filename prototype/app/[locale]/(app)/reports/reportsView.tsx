"use client";

import { useMemo, useState } from "react";
import { isThisMonth, isThisWeek, isThisYear, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import {
  getTranslation,
  reportsTranslations,
  salesTranslations,
  articlesTranslations,
  type Language,
} from "@/translations";

export type ReportItem = {
  saleId: string;
  createdAt: string;
  articleTitle: string;
  unitPrice: number;
  quantity: number;
  artistId: string | null;
  artistName: string | null;
  commissionAmount: number | null;
};

type Period = "today" | "week" | "month" | "year" | "all";

const periodPredicate: Record<Period, (date: Date) => boolean> = {
  today: (date) => isToday(date),
  week: (date) => isThisWeek(date, { weekStartsOn: 1 }),
  month: (date) => isThisMonth(date),
  year: (date) => isThisYear(date),
  all: () => true,
};

const periodLabelKey: Record<Period, "today" | "thisWeek" | "thisMonth" | "thisYear" | "all"> = {
  today: "today",
  week: "thisWeek",
  month: "thisMonth",
  year: "thisYear",
  all: "all",
};

type ArtistGroup = {
  key: string;
  name: string;
  items: ReportItem[];
  totalSales: number;
  totalCommission: number;
  quantitySold: number;
};

export function ReportsView({ language, items }: { language: Language; items: ReportItem[] }) {
  const [period, setPeriod] = useState<Period>("today");

  const filteredItems = useMemo(
    () => items.filter((item) => periodPredicate[period](new Date(item.createdAt))),
    [items, period]
  );

  const noArtistLabel = getTranslation(articlesTranslations.noArtist, language);

  const groups = useMemo(() => {
    const map = new Map<string, ArtistGroup>();
    for (const item of filteredItems) {
      const key = item.artistId ?? item.artistName ?? "__none__";
      const lineTotal = item.unitPrice * item.quantity;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
        existing.totalSales += lineTotal;
        existing.totalCommission += item.commissionAmount ?? 0;
        existing.quantitySold += item.quantity;
      } else {
        map.set(key, {
          key,
          name: item.artistName ?? noArtistLabel,
          items: [item],
          totalSales: lineTotal,
          totalCommission: item.commissionAmount ?? 0,
          quantitySold: item.quantity,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredItems, noArtistLabel]);

  const grandTotalSales = filteredItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotalCommission = filteredItems.reduce((sum, item) => sum + (item.commissionAmount ?? 0), 0);
  const grandTotalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <PageHeading
        title={getTranslation(reportsTranslations.title, language)}
        description={getTranslation(reportsTranslations.description, language)}
      />

      <div className="flex flex-wrap gap-2">
        {(["today", "week", "month", "year", "all"] as const).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={period === key ? "default" : "outline"}
            onClick={() => setPeriod(key)}
          >
            {getTranslation(salesTranslations[periodLabelKey[key]], language)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
          <span className="text-muted-foreground">
            {getTranslation(reportsTranslations.itemsSold, language)}: {grandTotalQuantity}
          </span>
          <span className="text-muted-foreground">
            {getTranslation(reportsTranslations.totalCommission, language)}: {grandTotalCommission.toFixed(2)} $
          </span>
          <span className="text-lg font-semibold">
            {getTranslation(reportsTranslations.totalSales, language)}: {grandTotalSales.toFixed(2)} $
          </span>
        </CardContent>
      </Card>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{getTranslation(reportsTranslations.empty, language)}</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.key}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-sm">{group.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {getTranslation(reportsTranslations.itemsSold, language)}: {group.quantitySold}
                  </span>
                  <span>
                    {getTranslation(reportsTranslations.totalCommission, language)}: {group.totalCommission.toFixed(2)} $
                  </span>
                  <span className="font-semibold text-foreground">
                    {getTranslation(reportsTranslations.totalSales, language)}: {group.totalSales.toFixed(2)} $
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1 text-sm">
                  {group.items.map((item, index) => (
                    <li key={`${item.saleId}-${index}`} className="flex justify-between gap-2 text-muted-foreground">
                      <span className="truncate">
                        {item.quantity} x {item.articleTitle}
                        {" · "}
                        {new Date(item.createdAt).toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA")}
                      </span>
                      <span className="whitespace-nowrap">
                        {(item.unitPrice * item.quantity).toFixed(2)} $
                        {item.commissionAmount !== null && (
                          <span className="ml-2 text-xs">
                            ({getTranslation(salesTranslations.commission, language)}: {item.commissionAmount.toFixed(2)} $)
                          </span>
                        )}
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
