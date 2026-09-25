import { withPrisma } from "@/lib/withPrisma";
import { type Language } from "@/translations";
import { SalesView, type SaleForHistory } from "./salesView";

export default async function SalesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = (locale === "en" ? "en" : "fr") as Language;

  const sales = await withPrisma((prisma) =>
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        employee: { select: { firstName: true, lastName: true } },
        items: true,
      },
    })
  );

  // Decimal n'est pas sérialisable par le RSC boundary — on convertit avant
  // de passer les données au composant client.
  const salesForHistory: SaleForHistory[] = sales.map((sale) => ({
    id: sale.id,
    createdAt: sale.createdAt.toISOString(),
    employeeName: `${sale.employee.firstName} ${sale.employee.lastName}`,
    paymentMethod: sale.paymentMethod,
    subtotal: Number(sale.subtotal),
    gstAmount: Number(sale.gstAmount),
    qstAmount: Number(sale.qstAmount),
    total: Number(sale.total),
    requiresDelivery: sale.requiresDelivery,
    deliveryNote: sale.deliveryNote,
    items: sale.items.map((item) => ({
      articleTitle: item.articleTitle,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      artistName: item.artistName,
      commissionTitle: item.commissionTitle,
      commissionAmount: item.commissionAmount !== null ? Number(item.commissionAmount) : null,
    })),
  }));

  return (
    <main className="mx-auto max-w-4xl p-4">
      <SalesView language={language} sales={salesForHistory} />
    </main>
  );
}
