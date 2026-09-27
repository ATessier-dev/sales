import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Mints un token d'upload direct navigateur -> Vercel Blob (voir artur,
// lib/media/actions.ts) : contourne la limite ~4.5MB des routes serverless,
// cette route ne fait que renvoyer le token. Publique comme le reste de la
// gestion du catalogue produit (voir app/[locale]/(app)/items/page.tsx).
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
      addRandomSuffix: true,
      maximumSizeInBytes: 10 * 1024 * 1024,
    }),
  });

  return NextResponse.json(jsonResponse);
}
