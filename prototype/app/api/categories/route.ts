import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";

// Catalogue public (voir app/[locale]/(app)/items/page.tsx) : gérer les
// catégories ne demande plus le code superuser, réservé à /settings.
export async function GET() {
  const categories = await withPrisma((prisma) => prisma.category.findMany({ orderBy: { sortOrder: "asc" } }));

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const lastCategory = await withPrisma((prisma) => prisma.category.findFirst({ orderBy: { sortOrder: "desc" } }));

  const category = await withPrisma((prisma) =>
    prisma.category.create({
      data: { name, sortOrder: (lastCategory?.sortOrder ?? -1) + 1 },
    })
  );

  return NextResponse.json({ category }, { status: 201 });
}
