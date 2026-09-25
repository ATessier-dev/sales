"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Minus, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeading } from "@/components/ui/pageHeading";
import { GST_RATE, QST_RATE, roundToCents } from "@/lib/tax";
import { getTranslation, posTranslations, articlesTranslations, type Language } from "@/translations";
import { articleImageSrc } from "@/lib/articleImage";

export type ArticleForPos = {
  id: string;
  title: string;
  type: "ORIGINAL" | "PRINT" | "OTHER";
  price: number;
  taxable: boolean;
  artistName: string | null;
  imageUrl: string | null;
};

type CartLine = { article: ArticleForPos; quantity: number };
type PaymentMethod = "CASH" | "CARD";

type SaleResponse = { sale: { id: string; total: string } };

async function createSale(payload: {
  items: { articleId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  requiresDelivery: boolean;
  deliveryNote: string | null;
}): Promise<SaleResponse> {
  const response = await fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("sale_failed");
  return response.json();
}

const typeLabelKey = { ORIGINAL: "typeOriginal", PRINT: "typePrint", OTHER: "typeOther" } as const;

export function PosView({ language, articles }: { language: Language; articles: ArticleForPos[] }) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [requiresDelivery, setRequiresDelivery] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");

  const mutation = useMutation({ mutationFn: createSale });

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return articles;
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.artistName?.toLowerCase().includes(query)
    );
  }, [articles, search]);

  const cartLines = Object.values(cart);

  function addToCart(article: ArticleForPos) {
    setCart((current) => {
      const existing = current[article.id];
      return {
        ...current,
        [article.id]: { article, quantity: (existing?.quantity ?? 0) + 1 },
      };
    });
  }

  function changeQuantity(articleId: string, delta: number) {
    setCart((current) => {
      const existing = current[articleId];
      if (!existing) return current;
      const quantity = existing.quantity + delta;
      if (quantity <= 0) {
        const { [articleId]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [articleId]: { ...existing, quantity } };
    });
  }

  function removeFromCart(articleId: string) {
    setCart((current) => {
      const { [articleId]: _removed, ...rest } = current;
      return rest;
    });
  }

  function resetSale() {
    setCart({});
    setRequiresDelivery(false);
    setDeliveryNote("");
    setPaymentMethod("CASH");
    mutation.reset();
  }

  const subtotal = roundToCents(
    cartLines.reduce((sum, line) => sum + line.article.price * line.quantity, 0)
  );
  const taxableSubtotal = roundToCents(
    cartLines
      .filter((line) => line.article.taxable)
      .reduce((sum, line) => sum + line.article.price * line.quantity, 0)
  );
  const gstAmount = roundToCents(taxableSubtotal * GST_RATE);
  const qstAmount = roundToCents(taxableSubtotal * QST_RATE);
  const total = roundToCents(subtotal + gstAmount + qstAmount);

  function handleSubmit() {
    mutation.mutate({
      items: cartLines.map((line) => ({ articleId: line.article.id, quantity: line.quantity })),
      paymentMethod,
      requiresDelivery,
      deliveryNote: requiresDelivery ? deliveryNote.trim() || null : null,
    });
  }

  if (mutation.isSuccess) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
          <p className="text-lg font-semibold">{getTranslation(posTranslations.saleSaved, language)}</p>
          <p className="text-2xl font-bold">{total.toFixed(2)} $</p>
          <Button onClick={resetSale}>{getTranslation(posTranslations.newSale, language)}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <PageHeading title={getTranslation(posTranslations.title, language)} />
        <Input
          placeholder={getTranslation(posTranslations.searchPlaceholder, language)}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {filteredArticles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{getTranslation(posTranslations.noArticles, language)}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {article.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={articleImageSrc(article.imageUrl)}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium leading-tight">{article.title}</p>
                        {article.artistName && (
                          <p className="text-xs text-muted-foreground">{article.artistName}</p>
                        )}
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold">
                      {article.price.toFixed(2)} $
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {getTranslation(articlesTranslations[typeLabelKey[article.type]], language)}
                    </span>
                    <Button size="sm" onClick={() => addToCart(article)}>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      {getTranslation(posTranslations.addToCart, language)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {getTranslation(posTranslations.cart, language)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{getTranslation(posTranslations.emptyCart, language)}</p>
          ) : (
            <div className="space-y-2">
              {cartLines.map((line) => (
                <div key={line.article.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{line.article.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.article.price.toFixed(2)} $ x {line.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeQuantity(line.article.id, -1)}>
                      <Minus className="h-3 w-3" aria-hidden="true" />
                    </Button>
                    <span className="w-5 text-center">{line.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeQuantity(line.article.id, 1)}>
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(line.article.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{getTranslation(posTranslations.subtotal, language)}</span>
              <span>{subtotal.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{getTranslation(posTranslations.gst, language)}</span>
              <span>{gstAmount.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{getTranslation(posTranslations.qst, language)}</span>
              <span>{qstAmount.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>{getTranslation(posTranslations.total, language)}</span>
              <span>{total.toFixed(2)} $</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{getTranslation(posTranslations.paymentMethod, language)}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentMethod === "CASH" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setPaymentMethod("CASH")}
              >
                {getTranslation(posTranslations.cash, language)}
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "CARD" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setPaymentMethod("CARD")}
              >
                {getTranslation(posTranslations.card, language)}
              </Button>
            </div>
            {paymentMethod === "CARD" && (
              <p className="text-xs text-muted-foreground">
                {getTranslation(posTranslations.cardConfirmHint, language)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={requiresDelivery}
                onChange={(event) => setRequiresDelivery(event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              {getTranslation(posTranslations.requiresDelivery, language)}
            </label>
            {requiresDelivery && (
              <textarea
                value={deliveryNote}
                onChange={(event) => setDeliveryNote(event.target.value)}
                placeholder={getTranslation(posTranslations.deliveryNotePlaceholder, language)}
                className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">{getTranslation(posTranslations.submitError, language)}</p>
          )}

          <Button className="w-full" disabled={cartLines.length === 0 || mutation.isPending} onClick={handleSubmit}>
            {getTranslation(posTranslations.submit, language)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
