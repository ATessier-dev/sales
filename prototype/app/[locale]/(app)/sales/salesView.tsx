"use client";

import { useMemo, useState } from "react";
import { isThisMonth, isThisWeek, isThisYear, isToday } from "date-fns";
import { Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, salesTranslations, posTranslations, type Language } from "@/translations";

export type SaleForHistory = {
  id: string;
  createdAt: string;
  employeeName: string;
  paymentMethod: "CASH" | "CARD";
  subtotal: number;
  gstAmount: number;
  qstAmount: number;
  total: number;
  requiresDelivery: boolean;
  deliveryNote: string | null;
  items: {
    articleTitle: string;
    unitPrice: number;
    quantity: number;
    artistName: string | null;
    commissionAmount: number | null;
  }[];
};

type Period = "today" | "week" | "month" | "year" | "all";

const periodPredicate: Record<Period, (date: Date) => boolean> = {
  today: (date) => isToday(date),
  week: (date) => isThisWeek(date, { weekStartsOn: 1 }),
  month: (date) => isThisMonth(date),
  year: (date) => isThisYear(date),
  all: () => true,
};

export function SalesView({ language, sales }: { language: Language; sales: SaleForHistory[] }) {
  const [period, setPeriod] = useState<Period>("today");

  const filteredSales = useMemo(
    () => sales.filter((sale) => periodPredicate[period](new Date(sale.createdAt))),
    [sales, period]
  );

  const totalForPeriod = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="space-y-4">
      <PageHeading
        title={getTranslation(salesTranslations.title, language)}
        description={getTranslation(salesTranslations.description, language)}
      />

      <div className="flex flex-wrap gap-2">
        {(["today", "week", "month", "year", "all"] as const).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={period === key ? "default" : "outline"}
            onClick={() => setPeriod(key)}
          >
            {getTranslation(
              salesTranslations[
                key === "today"
                  ? "today"
                  : key === "week"
                    ? "thisWeek"
                    : key === "month"
                      ? "thisMonth"
                      : key === "year"
                        ? "thisYear"
                        : "all"
              ],
              language
            )}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
          <span className="text-sm text-muted-foreground">
            {getTranslation(salesTranslations.saleCount, language)}: {filteredSales.length}
          </span>
          <span className="text-lg font-semibold">
            {getTranslation(salesTranslations.totalForPeriod, language)}: {totalForPeriod.toFixed(2)} $
          </span>
        </CardContent>
      </Card>

      {filteredSales.length === 0 ? (
        <p className="text-sm text-muted-foreground">{getTranslation(salesTranslations.empty, language)}</p>
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleString(language === "fr" ? "fr-CA" : "en-CA")}
                    {" · "}
                    {sale.employeeName}
                  </div>
                  <div className="flex items-center gap-2">
                    {sale.requiresDelivery && (
                      <Badge variant="outline" className="gap-1">
                        <Truck className="h-3 w-3" aria-hidden="true" />
                        {getTranslation(salesTranslations.delivery, language)}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {getTranslation(sale.paymentMethod === "CASH" ? posTranslations.cash : posTranslations.card, language)}
                    </Badge>
                    <span className="font-semibold">{sale.total.toFixed(2)} $</span>
                  </div>
                </div>

                <ul className="space-y-1 text-sm">
                  {sale.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-muted-foreground">
                      <span>
                        {item.quantity} x {item.articleTitle}
                        {item.artistName ? ` — ${item.artistName}` : ""}
                      </span>
                      <span>
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

                {sale.deliveryNote && (
                  <p className="text-xs italic text-muted-foreground">{sale.deliveryNote}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
