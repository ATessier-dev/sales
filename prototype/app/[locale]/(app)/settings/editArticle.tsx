"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { Trash2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, articlesTranslations, type Language } from "@/translations";
import { articleImageSrc } from "@/lib/articleImage";
import type { ArtistEntry } from "./editArtist";

export type ArticleType = "ORIGINAL" | "PRINT" | "OTHER";

export type ArticleEntry = {
  id: string;
  title: string;
  type: ArticleType;
  price: number;
  taxable: boolean;
  active: boolean;
  artistId: string | null;
  artistName: string | null;
  imageUrl: string | null;
};

const typeOptions: { value: ArticleType; labelKey: "typeOriginal" | "typePrint" | "typeOther" }[] = [
  { value: "ORIGINAL", labelKey: "typeOriginal" },
  { value: "PRINT", labelKey: "typePrint" },
  { value: "OTHER", labelKey: "typeOther" },
];

export function ArticleForm({
  language,
  initialValues,
  artists,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: ArticleEntry;
  artists: ArtistEntry[];
  onCancel: () => void;
  onSaved: (article: ArticleEntry) => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [type, setType] = useState<ArticleType>(initialValues?.type ?? "ORIGINAL");
  const [price, setPrice] = useState(String(initialValues?.price ?? ""));
  const [artistId, setArtistId] = useState(initialValues?.artistId ?? "");
  const [taxable, setTaxable] = useState(initialValues?.taxable ?? true);
  const [active, setActive] = useState(initialValues?.active ?? true);
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues?.imageUrl ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    setError(false);
    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/articles/image-upload",
      });
      setImageUrl(blob.url);
    } catch {
      setError(true);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/articles/${initialValues!.id}` : "/api/articles", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        price: Number(price),
        taxable,
        active,
        artistId: artistId || null,
        imageUrl,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const data = (await response.json()) as {
      article: {
        id: string;
        title: string;
        type: ArticleType;
        price: string;
        taxable: boolean;
        active: boolean;
        artistId: string | null;
        artist: { name: string } | null;
        imageUrl: string | null;
      };
    };
    onSaved({
      id: data.article.id,
      title: data.article.title,
      type: data.article.type,
      price: Number(data.article.price),
      taxable: data.article.taxable,
      active: data.article.active,
      artistId: data.article.artistId,
      artistName: data.article.artist?.name ?? null,
      imageUrl: data.article.imageUrl,
    });
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(false);

    const response = await fetch(`/api/articles/${initialValues.id}`, { method: "DELETE" });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    onDeleted();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="article-image">{getTranslation(articlesTranslations.imageLabel, language)}</Label>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={articleImageSrc(imageUrl)} alt="" className="h-16 w-16 rounded-md border border-border object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
              <ImageOff className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Input
              id="article-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={uploadingImage}
              className="max-w-xs"
            />
            {imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() => setImageUrl(null)}
                disabled={uploadingImage}
              >
                {getTranslation(articlesTranslations.removeImage, language)}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="article-title">{getTranslation(articlesTranslations.titleLabel, language)}</Label>
        <Input id="article-title" value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="article-type">{getTranslation(articlesTranslations.typeLabel, language)}</Label>
          <select
            id="article-type"
            value={type}
            onChange={(event) => setType(event.target.value as ArticleType)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {getTranslation(articlesTranslations[option.labelKey], language)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="article-price">{getTranslation(articlesTranslations.priceLabel, language)}</Label>
          <Input
            id="article-price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="article-artist">{getTranslation(articlesTranslations.artistLabel, language)}</Label>
        <select
          id="article-artist"
          value={artistId}
          onChange={(event) => setArtistId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{getTranslation(articlesTranslations.noArtist, language)}</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={taxable}
            onChange={(event) => setTaxable(event.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          {getTranslation(articlesTranslations.taxableLabel, language)}
        </label>
        {isEditing && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            {getTranslation(articlesTranslations.activeLabel, language)}
          </label>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{getTranslation(articlesTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(articlesTranslations.deleteArticle, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(articlesTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(articlesTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
