import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuserCode, UnauthorizedError, ForbiddenError } from "@/lib/auth/superuserCode";

// /pos lit la liste des employés directement via Prisma (page.tsx, actifs
// seulement, sélection sans code) : cette route ne sert plus qu'à /settings,
// donc toujours derrière le code superuser, pour le catalogue complet.
export async function GET(request: Request) {
  try {
    await requireSuperuserCode(request);

    const employees = await withPrisma((prisma) =>
      prisma.employee.findMany({ orderBy: { sortOrder: "asc" } })
    );

    return NextResponse.json({ employees });
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
      | { firstName?: unknown; lastName?: unknown; commissionRate?: unknown }
      | null;
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const commissionRate =
      typeof body?.commissionRate === "number" &&
      Number.isFinite(body.commissionRate) &&
      body.commissionRate >= 0 &&
      body.commissionRate <= 100
        ? body.commissionRate
        : undefined;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastEmployee = await withPrisma((prisma) =>
      prisma.employee.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const employee = await withPrisma((prisma) =>
      prisma.employee.create({
        data: { firstName, lastName, commissionRate, sortOrder: (lastEmployee?.sortOrder ?? -1) + 1 },
      })
    );

    return NextResponse.json({ employee }, { status: 201 });
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
