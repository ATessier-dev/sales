import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

// La caisse (/pos) ne doit voir que les provenances actives ; /settings a
// besoin de tout le catalogue pour pouvoir réactiver une provenance
// désactivée.
export async function GET(request: Request) {
  try {
    const session = await requireEmployee();

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("all") !== "1";

    const commissions = await withPrisma((prisma) =>
      prisma.commission.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: { sortOrder: "asc" },
      })
    );

    // Le taux n'est jamais exposé côté caisse, seul le titre l'est : un
    // employé ne doit pas pouvoir le lire, même en inspectant cette réponse.
    const payload =
      session.role === "SUPERUSER"
        ? commissions
        : commissions.map(({ rate: _rate, ...rest }) => rest);

    return NextResponse.json({ commissions: payload });
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
