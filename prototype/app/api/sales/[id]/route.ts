import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";

export async function GET(request: Request, { params }: RouteContext<"/api/sales/[id]">) {
  try {
    await requireEmployee();
    const { id } = await params;

    const sale = await withPrisma((prisma) =>
      prisma.sale.findUnique({
        where: { id },
        include: { employee: { select: { firstName: true, lastName: true } }, items: true },
      })
    );

    if (!sale) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
