import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

const ARTICLE_TYPES = ["ORIGINAL", "PRINT", "OTHER"] as const;
type ArticleType = (typeof ARTICLE_TYPES)[number];

function isArticleType(value: unknown): value is ArticleType {
  return typeof value === "string" && (ARTICLE_TYPES as readonly string[]).includes(value);
}

// La caisse (/pos) ne doit voir que les articles actifs ; /settings a besoin
// de tout le catalogue pour pouvoir réactiver un article désactivé.
export async function GET(request: Request) {
  try {
    await requireEmployee();

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("all") !== "1";

    const articles = await withPrisma((prisma) =>
      prisma.article.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: { sortOrder: "asc" },
        include: { artist: { select: { id: true, name: true } } },
      })
    );

    return NextResponse.json({ articles });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as
      | { title?: unknown; type?: unknown; price?: unknown; taxable?: unknown; artistId?: unknown }
      | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const type = isArticleType(body?.type) ? body.type : "ORIGINAL";
    const price = typeof body?.price === "number" ? body.price : NaN;
    const taxable = typeof body?.taxable === "boolean" ? body.taxable : true;
    const artistId = typeof body?.artistId === "string" && body.artistId ? body.artistId : null;

    if (!title || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (artistId) {
      const artist = await withPrisma((prisma) => prisma.artist.findUnique({ where: { id: artistId } }));
      if (!artist) {
        return NextResponse.json({ error: "artist_not_found" }, { status: 400 });
      }
    }

    const lastArticle = await withPrisma((prisma) =>
      prisma.article.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const article = await withPrisma((prisma) =>
      prisma.article.create({
        data: { title, type, price, taxable, artistId, sortOrder: (lastArticle?.sortOrder ?? -1) + 1 },
        include: { artist: { select: { id: true, name: true } } },
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
