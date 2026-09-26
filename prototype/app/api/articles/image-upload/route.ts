import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireSuperuserCode, UnauthorizedError, ForbiddenError } from "@/lib/auth/superuserCode";

// Mints un token d'upload direct navigateur -> Vercel Blob (voir artur,
// lib/media/actions.ts) : contourne la limite ~4.5MB des routes serverless,
// cette route ne fait que vérifier l'autorisation et renvoyer le token.
export async function POST(request: Request) {
  try {
    await requireSuperuserCode(request);

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
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw error;
  }
}
