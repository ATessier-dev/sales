import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";

// Catalogue public (voir app/[locale]/(app)/items/page.tsx) : gérer les
// artistes ne demande plus le code superuser, réservé à /settings.
export async function GET() {
  const artists = await withPrisma((prisma) => prisma.artist.findMany({ orderBy: { sortOrder: "asc" } }));

  return NextResponse.json({ artists });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const lastArtist = await withPrisma((prisma) => prisma.artist.findFirst({ orderBy: { sortOrder: "desc" } }));

  const artist = await withPrisma((prisma) =>
    prisma.artist.create({
      data: { name, sortOrder: (lastArtist?.sortOrder ?? -1) + 1 },
    })
  );

  return NextResponse.json({ artist }, { status: 201 });
}
