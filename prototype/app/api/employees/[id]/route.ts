import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuserCode, UnauthorizedError, ForbiddenError } from "@/lib/auth/superuserCode";

export async function PATCH(request: Request, { params }: RouteContext<"/api/employees/[id]">) {
  try {
    await requireSuperuserCode(request);
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.employee.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as
      | { firstName?: unknown; lastName?: unknown; active?: unknown; commissionRate?: unknown }
      | null;
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() || undefined : undefined;
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() || undefined : undefined;
    const active = typeof body?.active === "boolean" ? body.active : undefined;
    const commissionRate =
      typeof body?.commissionRate === "number" &&
      Number.isFinite(body.commissionRate) &&
      body.commissionRate >= 0 &&
      body.commissionRate <= 100
        ? body.commissionRate
        : undefined;

    if (body && "firstName" in body && !firstName) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    if (body && "lastName" in body && !lastName) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const employee = await withPrisma((prisma) =>
      prisma.employee.update({ where: { id }, data: { firstName, lastName, active, commissionRate } })
    );

    return NextResponse.json({ employee });
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

// Supprimer un employé ne supprime pas ses ventes : Sale.employeeId reste une
// FK obligatoire, mais l'historique existant garde déjà employeeName figé
// nulle part ailleurs que via la relation ; on empêche donc la suppression
// d'un employé qui a des ventes plutôt que de casser cette référence.
export async function DELETE(request: Request, { params }: RouteContext<"/api/employees/[id]">) {
  try {
    await requireSuperuserCode(request);
    const { id } = await params;

    const existing = await withPrisma((prisma) =>
      prisma.employee.findUnique({ where: { id }, include: { _count: { select: { sales: true } } } })
    );
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (existing._count.sales > 0) {
      return NextResponse.json({ error: "employee_has_sales" }, { status: 409 });
    }

    await withPrisma((prisma) => prisma.employee.delete({ where: { id } }));

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
