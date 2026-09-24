"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Image as ImageIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, articlesTranslations, type Language } from "@/translations";
import { ArticleForm, type ArticleEntry } from "./editArticle";
import type { ArtistEntry } from "./editArtist";

export function ArticlesManager({
  language,
  articles,
  artists,
}: {
  language: Language;
  articles: ArticleEntry[];
  artists: ArtistEntry[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | ArticleEntry | null>(null);

  function handleSaved() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(articlesTranslations.title, language)}
          </span>
        }
        actions={
          <Button size="sm" onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(articlesTranslations.addArticle, language)}
          </Button>
        }
      />

      {formMode && (
        <ArticleForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          artists={artists}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {articles.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(articlesTranslations.empty, language)}</p>
        ) : (
          articles.map((article) => (
            <Card key={article.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex flex-col gap-0.5 text-sm">
                  <span>
                    {article.title}
                    {!article.active ? " · inactif" : ""}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {article.price.toFixed(2)} $
                    {article.artistName ? ` — ${article.artistName}` : ""}
                  </span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setFormMode(article)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {getTranslation(articlesTranslations.editArticle, language)}
                </Button>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
