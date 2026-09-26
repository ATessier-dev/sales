import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";

export async function GET(request: Request, { params }: RouteContext<"/api/sales/[id]">) {
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
}
