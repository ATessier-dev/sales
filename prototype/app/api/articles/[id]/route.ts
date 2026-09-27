import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";

export async function PATCH(request: Request, { params }: RouteContext<"/api/articles/[id]">) {
  const { id } = await params;

  const existing = await withPrisma((prisma) => prisma.article.findUnique({ where: { id } }));
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        title?: unknown;
        price?: unknown;
        taxable?: unknown;
        active?: unknown;
        artistId?: unknown;
        categoryId?: unknown;
        imageUrl?: unknown;
      }
    | null;

  const title = typeof body?.title === "string" ? body.title.trim() || undefined : undefined;
  const price =
    typeof body?.price === "number" && Number.isFinite(body.price) && body.price >= 0 ? body.price : undefined;
  const taxable = typeof body?.taxable === "boolean" ? body.taxable : undefined;
  const active = typeof body?.active === "boolean" ? body.active : undefined;
  const artistId =
    body && "artistId" in body
      ? typeof body.artistId === "string" && body.artistId
        ? body.artistId
        : null
      : undefined;
  const categoryId =
    body && "categoryId" in body
      ? typeof body.categoryId === "string" && body.categoryId
        ? body.categoryId
        : null
      : undefined;
  const imageUrl =
    body && "imageUrl" in body
      ? typeof body.imageUrl === "string" && body.imageUrl
        ? body.imageUrl
        : null
      : undefined;

  if (body && "title" in body && !title) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (artistId) {
    const artist = await withPrisma((prisma) => prisma.artist.findUnique({ where: { id: artistId } }));
    if (!artist) {
      return NextResponse.json({ error: "artist_not_found" }, { status: 400 });
    }
  }

  if (categoryId) {
    const category = await withPrisma((prisma) => prisma.category.findUnique({ where: { id: categoryId } }));
    if (!category) {
      return NextResponse.json({ error: "category_not_found" }, { status: 400 });
    }
  }

  const article = await withPrisma((prisma) =>
    prisma.article.update({
      where: { id },
      data: { title, price, taxable, active, artistId, categoryId, imageUrl },
      include: {
        artist: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    })
  );

  return NextResponse.json({ article });
}

// Un article vendu ne doit pas disparaître de l'historique des ventes :
// SaleItem.articleId est onDelete: SetNull, la ligne garde son snapshot
// (articleTitle, unitPrice...) même après suppression de l'article.
export async function DELETE(request: Request, { params }: RouteContext<"/api/articles/[id]">) {
  const { id } = await params;

  const existing = await withPrisma((prisma) => prisma.article.findUnique({ where: { id } }));
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await withPrisma((prisma) => prisma.article.delete({ where: { id } }));

  return new NextResponse(null, { status: 204 });
}
