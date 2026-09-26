import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuserCode, UnauthorizedError, ForbiddenError } from "@/lib/auth/superuserCode";

// /pos lit les commissions directement via Prisma (page.tsx, id/title
// seulement, jamais le taux) : cette route ne sert plus qu'à /settings, donc
// toujours derrière le code superuser, taux inclus.
export async function GET(request: Request) {
  try {
    await requireSuperuserCode(request);

    const commissions = await withPrisma((prisma) =>
      prisma.commission.findMany({ orderBy: { sortOrder: "asc" } })
    );

    return NextResponse.json({ commissions });
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
      | { title?: unknown; rate?: unknown }
      | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const rate = typeof body?.rate === "number" ? body.rate : NaN;

    if (!title || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastCommission = await withPrisma((prisma) =>
      prisma.commission.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const commission = await withPrisma((prisma) =>
      prisma.commission.create({
        data: { title, rate, sortOrder: (lastCommission?.sortOrder ?? -1) + 1 },
      })
    );

    return NextResponse.json({ commission }, { status: 201 });
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
