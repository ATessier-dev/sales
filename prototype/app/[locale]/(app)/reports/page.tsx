import { withPrisma } from "@/lib/withPrisma";
import { type Language } from "@/translations";
import { ReportsView, type ReportItem } from "./reportsView";

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = (locale === "en" ? "en" : "fr") as Language;

  const sales = await withPrisma((prisma) =>
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { items: true },
    })
  );

  // Decimal n'est pas sérialisable par le RSC boundary — on convertit avant
  // de passer les données au composant client. Chaque ligne porte la date de
  // sa vente : le regroupement par artiste se fait côté client, la période
  // se filtre donc par ligne plutôt que par vente.
  const reportItems: ReportItem[] = sales.flatMap((sale) =>
    sale.items.map((item) => ({
      saleId: sale.id,
      createdAt: sale.createdAt.toISOString(),
      articleTitle: item.articleTitle,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      artistId: item.artistId,
      artistName: item.artistName,
      commissionAmount: item.commissionAmount !== null ? Number(item.commissionAmount) : null,
    }))
  );

  return (
    <main className="mx-auto max-w-4xl p-4">
      <ReportsView language={language} items={reportItems} />
    </main>
  );
}
