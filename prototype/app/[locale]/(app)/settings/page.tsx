import { getSession } from "@/lib/auth/session";
import { withPrisma } from "@/lib/withPrisma";
import { redirect } from "@/i18n/navigation";
import { type Language } from "@/translations";
import { ArtistsManager } from "./artistsManager";
import { ArticlesManager } from "./articlesManager";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = (locale === "en" ? "en" : "fr") as Language;

  const sessionUser = await getSession();
  if (!sessionUser) return null;
  if (sessionUser.role !== "SUPERUSER") {
    redirect({ href: "/pos", locale });
  }

  const [artists, articles] = await Promise.all([
    withPrisma((prisma) => prisma.artist.findMany({ orderBy: { sortOrder: "asc" } })),
    withPrisma((prisma) =>
      prisma.article.findMany({
        orderBy: { sortOrder: "asc" },
        include: { artist: { select: { id: true, name: true } } },
      })
    ),
  ]);

  // Decimal n'est pas sérialisable par le RSC boundary — on convertit avant
  // de passer les données aux composants clients.
  const artistsForSettings = artists.map((artist) => ({
    id: artist.id,
    name: artist.name,
    commissionRate: Number(artist.commissionRate),
    active: artist.active,
  }));

  const articlesForSettings = articles.map((article) => ({
    id: article.id,
    title: article.title,
    type: article.type,
    price: Number(article.price),
    taxable: article.taxable,
    active: article.active,
    artistId: article.artistId,
    artistName: article.artist?.name ?? null,
    imageUrl: article.imageUrl,
  }));

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 p-4">
      <ArtistsManager language={language} artists={artistsForSettings} />
      <ArticlesManager
        language={language}
        articles={articlesForSettings}
        artists={artistsForSettings.filter((artist) => artist.active)}
      />
    </main>
  );
}
