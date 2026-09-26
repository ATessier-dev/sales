import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";

// Article.imageUrl est un blob privé : sa propre URL exige une authentification
// Vercel Blob, donc aucun <img> ne peut la charger directement. Cette route
// vérifie la session employé puis relaie le contenu depuis le stockage.
// Passer `token` explicitement (plutôt que de laisser le SDK tenter l'auth
// OIDC du projet) : l'OIDC n'est pas activé pour l'environnement
// "development" ici, seul le token statique fonctionne partout.
export async function GET(request: Request) {
  try {
    await requireEmployee();

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
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

function isBlobUrl(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith(".private.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
