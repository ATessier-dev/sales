import { withPrisma } from "@/lib/withPrisma";
import { type Language } from "@/translations";
import { ArtistsManager } from "./artistsManager";
import { ArticlesManager } from "./articlesManager";
import { CategoriesManager } from "./categoriesManager";

// Public, comme /pos : la gestion du catalogue produit (articles, artistes,
// catégories) ne demande plus le code superuser, qui reste réservé à
// /settings (commissions, employés, taxes).
export default async function ItemsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = (locale === "en" ? "en" : "fr") as Language;

  const [artists, articles, categories] = await Promise.all([
    withPrisma((prisma) => prisma.artist.findMany({ orderBy: { sortOrder: "asc" } })),
    withPrisma((prisma) =>
      prisma.article.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          artist: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      })
    ),
    withPrisma((prisma) => prisma.category.findMany({ orderBy: { sortOrder: "asc" } })),
  ]);

  // Decimal n'est pas sérialisable par le RSC boundary — on convertit avant
  // de passer les données aux composants clients.
  const artistsForItems = artists.map((artist) => ({
    id: artist.id,
    name: artist.name,
    active: artist.active,
  }));

  const articlesForItems = articles.map((article) => ({
    id: article.id,
    title: article.title,
    price: Number(article.price),
    taxable: article.taxable,
    active: article.active,
    artistId: article.artistId,
    artistName: article.artist?.name ?? null,
    categoryId: article.categoryId,
    categoryName: article.category?.name ?? null,
    imageUrl: article.imageUrl,
  }));

  const categoriesForItems = categories.map((category) => ({
    id: category.id,
    name: category.name,
    active: category.active,
  }));

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 lg:grid-cols-3 lg:items-start">
      <ArticlesManager
        language={language}
        articles={articlesForItems}
        artists={artistsForItems.filter((artist) => artist.active)}
        categories={categoriesForItems.filter((category) => category.active)}
      />
      <ArtistsManager language={language} artists={artistsForItems} />
      <CategoriesManager language={language} categories={categoriesForItems} />
    </main>
  );
}
