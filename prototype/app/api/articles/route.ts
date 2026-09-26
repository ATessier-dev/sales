import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuserCode, UnauthorizedError, ForbiddenError } from "@/lib/auth/superuserCode";

// /pos lit le catalogue directement via Prisma (page.tsx) : cette route ne
// sert plus qu'à /settings, donc toujours derrière le code superuser, pour
// le catalogue complet (actifs + inactifs).
export async function GET(request: Request) {
  try {
    await requireSuperuserCode(request);

    const articles = await withPrisma((prisma) =>
      prisma.article.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          artist: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      })
    );

    return NextResponse.json({ articles });
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

export async function POST(request: Request) {
  try {
    await requireSuperuserCode(request);

    const body = (await request.json().catch(() => null)) as
      | {
          title?: unknown;
          price?: unknown;
          taxable?: unknown;
          artistId?: unknown;
          categoryId?: unknown;
          imageUrl?: unknown;
        }
      | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const price = typeof body?.price === "number" ? body.price : NaN;
    const taxable = typeof body?.taxable === "boolean" ? body.taxable : true;
    const artistId = typeof body?.artistId === "string" && body.artistId ? body.artistId : null;
    const categoryId = typeof body?.categoryId === "string" && body.categoryId ? body.categoryId : null;
    const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl ? body.imageUrl : null;

    if (!title || !Number.isFinite(price) || price < 0) {
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

    const lastArticle = await withPrisma((prisma) =>
      prisma.article.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const article = await withPrisma((prisma) =>
      prisma.article.create({
        data: {
          title,
          price,
          taxable,
          artistId,
          categoryId,
          imageUrl,
          sortOrder: (lastArticle?.sortOrder ?? -1) + 1,
        },
        include: {
          artist: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      })
    );

    return NextResponse.json({ article }, { status: 201 });
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
