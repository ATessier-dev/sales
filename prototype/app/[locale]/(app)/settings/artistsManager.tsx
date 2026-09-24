"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Palette } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, artistsTranslations, type Language } from "@/translations";
import { ArtistForm, type ArtistEntry } from "./editArtist";

export function ArtistsManager({ language, artists }: { language: Language; artists: ArtistEntry[] }) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | ArtistEntry | null>(null);

  function handleSaved() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(artistsTranslations.title, language)}
          </span>
        }
        actions={
          <Button size="sm" onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(artistsTranslations.addArtist, language)}
          </Button>
        }
      />

      {formMode && (
        <ArtistForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {artists.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(artistsTranslations.empty, language)}</p>
        ) : (
          artists.map((artist) => (
            <Card key={artist.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {artist.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    {artist.commissionRate}%{!artist.active ? " · inactif" : ""}
                  </span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setFormMode(artist)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {getTranslation(artistsTranslations.editArtist, language)}
                </Button>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
