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
import { ArtistsManager } from "./artistsManager";
import { ArticlesManager } from "./articlesManager";
import { CommissionsManager } from "./commissionsManager";
import { CategoriesManager } from "./categoriesManager";
import { EmployeesManager } from "./employeesManager";
import type { ArtistEntry } from "./editArtist";
import type { ArticleEntry } from "./editArticle";
import type { CommissionEntry } from "./editCommission";
import type { CategoryEntry } from "./editCategory";
import type { EmployeeEntry } from "./editEmployee";

type SettingsData = {
  artists: ArtistEntry[];
  articles: ArticleEntry[];
  commissions: CommissionEntry[];
  categories: CategoryEntry[];
  employees: EmployeeEntry[];
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
  const [artistsRes, articlesRes, commissionsRes, categoriesRes, employeesRes] = await Promise.all([
    fetch("/api/artists", { headers }),
    fetch("/api/articles", { headers }),
    fetch("/api/commissions", { headers }),
    fetch("/api/categories", { headers }),
    fetch("/api/employees", { headers }),
  ]);

  if (
    !artistsRes.ok ||
    !articlesRes.ok ||
    !commissionsRes.ok ||
    !categoriesRes.ok ||
    !employeesRes.ok
  ) {
    throw new Error("fetch_failed");
  }

  const [artistsJson, articlesJson, commissionsJson, categoriesJson, employeesJson] = await Promise.all([
    artistsRes.json(),
    articlesRes.json(),
    commissionsRes.json(),
    categoriesRes.json(),
    employeesRes.json(),
  ]);

  return {
    artists: artistsJson.artists.map((artist: { id: string; name: string; active: boolean }) => ({
      id: artist.id,
      name: artist.name,
      active: artist.active,
    })),
    articles: articlesJson.articles.map(
      (article: {
        id: string;
        title: string;
        price: string;
        taxable: boolean;
        active: boolean;
        artistId: string | null;
        artist: { name: string } | null;
        categoryId: string | null;
        category: { name: string } | null;
        imageUrl: string | null;
      }) => ({
        id: article.id,
        title: article.title,
        price: Number(article.price),
        taxable: article.taxable,
        active: article.active,
        artistId: article.artistId,
        artistName: article.artist?.name ?? null,
        categoryId: article.categoryId,
        categoryName: article.category?.name ?? null,
        imageUrl: article.imageUrl,
      })
    ),
    commissions: commissionsJson.commissions.map(
      (commission: { id: string; title: string; rate: string; active: boolean }) => ({
        id: commission.id,
        title: commission.title,
        rate: Number(commission.rate),
        active: commission.active,
      })
    ),
    categories: categoriesJson.categories.map((category: { id: string; name: string; active: boolean }) => ({
      id: category.id,
      name: category.name,
      active: category.active,
    })),
    employees: employeesJson.employees.map(
      (employee: { id: string; firstName: string; lastName: string; active: boolean }) => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        active: employee.active,
      })
    ),
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

  const { artists, articles, commissions, categories, employees } = query.data;

  return (
    <SuperuserCodeProvider value={code}>
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 p-4">
        <ArtistsManager language={language} artists={artists} onChanged={query.refetch} />
        <EmployeesManager language={language} employees={employees} onChanged={query.refetch} />
        <CategoriesManager language={language} categories={categories} onChanged={query.refetch} />
        <ArticlesManager
          language={language}
          articles={articles}
          artists={artists.filter((artist) => artist.active)}
          categories={categories.filter((category) => category.active)}
          onChanged={query.refetch}
        />
        <CommissionsManager language={language} commissions={commissions} onChanged={query.refetch} />
      </main>
    </SuperuserCodeProvider>
  );
}
