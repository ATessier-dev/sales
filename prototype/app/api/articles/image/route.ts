import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

// Article.imageUrl est un blob privé : sa propre URL exige une authentification
// Vercel Blob, donc aucun <img> ne peut la charger directement. Cette route
// relaie le contenu depuis le stockage ; /pos est public (pas de code), donc
// cette route l'est aussi (les photos d'articles ne sont pas sensibles).
// Passer `token` explicitement (plutôt que de laisser le SDK tenter l'auth
// OIDC du projet) : l'OIDC n'est pas activé pour l'environnement
// "development" ici, seul le token statique fonctionne partout.
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url || !isBlobUrl(url)) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const blob = await get(url, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

function isBlobUrl(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith(".private.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
