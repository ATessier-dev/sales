import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

const ARTICLE_TYPES = ["ORIGINAL", "PRINT", "OTHER"] as const;
type ArticleType = (typeof ARTICLE_TYPES)[number];

function isArticleType(value: unknown): value is ArticleType {
  return typeof value === "string" && (ARTICLE_TYPES as readonly string[]).includes(value);
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/articles/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.article.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          title?: unknown;
          type?: unknown;
          price?: unknown;
          taxable?: unknown;
          active?: unknown;
          artistId?: unknown;
          imageUrl?: unknown;
        }
      | null;

    const title = typeof body?.title === "string" ? body.title.trim() || undefined : undefined;
    const type = isArticleType(body?.type) ? body.type : undefined;
    const price =
      typeof body?.price === "number" && Number.isFinite(body.price) && body.price >= 0
        ? body.price
        : undefined;
    const taxable = typeof body?.taxable === "boolean" ? body.taxable : undefined;
    const active = typeof body?.active === "boolean" ? body.active : undefined;
    const artistId =
      body && "artistId" in body
        ? typeof body.artistId === "string" && body.artistId
          ? body.artistId
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

    const article = await withPrisma((prisma) =>
      prisma.article.update({
        where: { id },
        data: { title, type, price, taxable, active, artistId, imageUrl },
        include: { artist: { select: { id: true, name: true } } },
      })
    );

    return NextResponse.json({ article });
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

// Un article vendu ne doit pas disparaître de l'historique des ventes :
// SaleItem.articleId est onDelete: SetNull, la ligne garde son snapshot
// (articleTitle, unitPrice...) même après suppression de l'article.
export async function DELETE(request: Request, { params }: RouteContext<"/api/articles/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.article.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.article.delete({ where: { id } }));

    return new NextResponse(null, { status: 204 });
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
