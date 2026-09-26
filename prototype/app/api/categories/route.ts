import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

// La caisse (/pos) ne doit voir que les catégories actives ; /settings a
// besoin de tout le catalogue pour pouvoir réactiver une catégorie
// désactivée.
export async function GET(request: Request) {
  try {
    await requireEmployee();

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("all") !== "1";

    const categories = await withPrisma((prisma) =>
      prisma.category.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: { sortOrder: "asc" },
      })
    );

    return NextResponse.json({ categories });
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

    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastCategory = await withPrisma((prisma) =>
      prisma.category.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const category = await withPrisma((prisma) =>
      prisma.category.create({
        data: { name, sortOrder: (lastCategory?.sortOrder ?? -1) + 1 },
      })
    );

    return NextResponse.json({ category }, { status: 201 });
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
