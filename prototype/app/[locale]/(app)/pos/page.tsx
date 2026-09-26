import { withPrisma } from "@/lib/withPrisma";
import { type Language } from "@/translations";
import { PosView, type ArticleForPos } from "./posView";

export default async function PosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = (locale === "en" ? "en" : "fr") as Language;

  const [articles, commissions, categories] = await Promise.all([
    withPrisma((prisma) =>
      prisma.article.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: {
          artist: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      })
    ),
    // Seuls id/title sont lus : le taux ne doit jamais transiter jusqu'à la
    // caisse, même dans le HTML/RSC payload de cette page.
    withPrisma((prisma) =>
      prisma.commission.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, title: true },
      })
    ),
    withPrisma((prisma) =>
      prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
    ),
  ]);

  // Decimal n'est pas sérialisable par le RSC boundary — on convertit avant
  // de passer les données au composant client.
  const articlesForPos: ArticleForPos[] = articles.map((article) => ({
    id: article.id,
    title: article.title,
    price: Number(article.price),
    taxable: article.taxable,
    artistId: article.artistId,
    artistName: article.artist?.name ?? null,
    categoryId: article.categoryId,
    categoryName: article.category?.name ?? null,
    imageUrl: article.imageUrl,
  }));

  return (
    <main className="mx-auto max-w-5xl p-4">
      <PosView language={language} articles={articlesForPos} commissions={commissions} categories={categories} />
    </main>
  );
}
