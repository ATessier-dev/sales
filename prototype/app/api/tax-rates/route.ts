import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuserCode, UnauthorizedError, ForbiddenError } from "@/lib/auth/superuserCode";

// Singleton (voir prisma/schema.prisma TaxRate) : pas de [id], toujours la
// ligne "default". Lecture et écriture réservées à /settings, comme
// Commission/Employee — /pos et /api/sales lisent directement via
// lib/taxRates.ts#getTaxRates() sans passer par cette route.
export async function GET(request: Request) {
  try {
    await requireSuperuserCode(request);

    const taxRate = await withPrisma((prisma) =>
      prisma.taxRate.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } })
    );

    return NextResponse.json({ taxRate });
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

export async function PATCH(request: Request) {
  try {
    await requireSuperuserCode(request);

    const body = (await request.json().catch(() => null)) as
      | { gstRate?: unknown; qstRate?: unknown }
      | null;
    const gstRate =
      typeof body?.gstRate === "number" && Number.isFinite(body.gstRate) && body.gstRate >= 0 && body.gstRate <= 100
        ? body.gstRate
        : undefined;
    const qstRate =
      typeof body?.qstRate === "number" && Number.isFinite(body.qstRate) && body.qstRate >= 0 && body.qstRate <= 100
        ? body.qstRate
        : undefined;

    if (gstRate === undefined || qstRate === undefined) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const taxRate = await withPrisma((prisma) =>
      prisma.taxRate.upsert({
        where: { id: "default" },
        update: { gstRate, qstRate },
        create: { id: "default", gstRate, qstRate },
      })
    );

    return NextResponse.json({ taxRate });
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
