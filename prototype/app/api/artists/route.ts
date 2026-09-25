import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

export async function GET() {
  try {
    await requireEmployee();

    const artists = await withPrisma((prisma) =>
      prisma.artist.findMany({ orderBy: { sortOrder: "asc" } })
    );

    return NextResponse.json({ artists });
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

    const lastArtist = await withPrisma((prisma) =>
      prisma.artist.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const artist = await withPrisma((prisma) =>
      prisma.artist.create({
        data: { name, sortOrder: (lastArtist?.sortOrder ?? -1) + 1 },
      })
    );

    return NextResponse.json({ artist }, { status: 201 });
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
