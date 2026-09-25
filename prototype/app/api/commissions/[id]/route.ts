import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

export async function PATCH(request: Request, { params }: RouteContext<"/api/commissions/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.commission.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as
      | { title?: unknown; rate?: unknown; active?: unknown }
      | null;
    const title = typeof body?.title === "string" ? body.title.trim() || undefined : undefined;
    const rate =
      typeof body?.rate === "number" && Number.isFinite(body.rate) && body.rate >= 0 && body.rate <= 100
        ? body.rate
        : undefined;
    const active = typeof body?.active === "boolean" ? body.active : undefined;

    if (body && "title" in body && !title) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const commission = await withPrisma((prisma) =>
      prisma.commission.update({ where: { id }, data: { title, rate, active } })
    );

    return NextResponse.json({ commission });
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

// Une commission utilisée par des ventes passées ne doit pas les faire
// disparaître : SaleItem.commissionId est onDelete: SetNull, la ligne garde
// son titre/taux/montant figés même après suppression de la provenance.
export async function DELETE(request: Request, { params }: RouteContext<"/api/commissions/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.commission.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.commission.delete({ where: { id } }));

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
