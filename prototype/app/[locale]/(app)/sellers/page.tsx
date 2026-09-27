import { withPrisma } from "@/lib/withPrisma";
import { type Language } from "@/translations";
import { SellersView, type SellerSaleItem } from "./sellersView";

export default async function SellersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = (locale === "en" ? "en" : "fr") as Language;

  const sales = await withPrisma((prisma) =>
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        createdAt: true,
        employeeId: true,
        employee: { select: { firstName: true, lastName: true } },
        subtotal: true,
        employeeCommissionAmount: true,
      },
    })
  );

  // Decimal n'est pas sérialisable par le RSC boundary — on convertit avant
  // de passer les données au composant client.
  const items: SellerSaleItem[] = sales.map((sale) => ({
    saleId: sale.id,
    createdAt: sale.createdAt.toISOString(),
    employeeId: sale.employeeId,
    employeeName: `${sale.employee.firstName} ${sale.employee.lastName}`,
    // Sous-total avant taxes : même base que le calcul de la commission, les
    // deux chiffres se répondent directement (voir sellersView.tsx).
    soldAmount: Number(sale.subtotal),
    commissionAmount: Number(sale.employeeCommissionAmount),
  }));

  return (
    <main className="mx-auto max-w-4xl p-4">
      <SellersView language={language} items={items} />
    </main>
  );
}
