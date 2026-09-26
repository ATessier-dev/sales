import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuserCode, UnauthorizedError, ForbiddenError } from "@/lib/auth/superuserCode";

export async function PATCH(request: Request, { params }: RouteContext<"/api/artists/[id]">) {
  try {
    await requireSuperuserCode(request);
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.artist.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as
      | { name?: unknown; active?: unknown }
      | null;
    const name = typeof body?.name === "string" ? body.name.trim() || undefined : undefined;
    const active = typeof body?.active === "boolean" ? body.active : undefined;

    if (body && "name" in body && !name) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const artist = await withPrisma((prisma) =>
      prisma.artist.update({ where: { id }, data: { name, active } })
    );

    return NextResponse.json({ artist });
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

// Supprimer un artiste ne supprime pas ses articles : Article.artistId est
// onDelete: SetNull, les articles restent au catalogue sans artiste assigné.
export async function DELETE(request: Request, { params }: RouteContext<"/api/artists/[id]">) {
  try {
    await requireSuperuserCode(request);
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.artist.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.artist.delete({ where: { id } }));

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
