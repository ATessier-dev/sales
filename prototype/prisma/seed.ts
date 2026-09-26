import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Unlike `next dev`, running this script via `tsx` loads no .env file on its
// own — and a naive `source .env.local` in bash mis-parses a Neon URL's
// unescaped `&` (channel_binding=require&sslmode=require) as a background
// job separator, silently truncating DATABASE_URL. dotenv's parser has none
// of that shell-quoting hazard, so load it the same way prisma.config.ts does.
loadEnv({ path: ".env.local" });
loadEnv();

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Employee ne sert plus qu'à attribuer une vente (voir lib/auth/superuserCode.ts
  // pour le code superuser, désormais un secret unique séparé de tout compte).
  // Upsert par id (et non par une clé "seed-employee-*" recréée) : ces deux
  // employés existaient déjà avant la suppression du login (comptes EMP001/
  // SUP001) et sont référencés par des ventes de test réelles en base ; les
  // recréer sous un nouvel id aurait dupliqué la liste sans rien apporter.
  await prisma.employee.upsert({
    where: { id: "cmufw0utu0000rgwdd1qk6yiz" },
    update: { sortOrder: 0 },
    create: { id: "cmufw0utu0000rgwdd1qk6yiz", firstName: "Alex", lastName: "Tremblay", sortOrder: 0 },
  });

  await prisma.employee.upsert({
    where: { id: "cmufw0v0v0001rgwdb7hg9e38" },
    update: { sortOrder: 1 },
    create: { id: "cmufw0v0v0001rgwdb7hg9e38", firstName: "Sam", lastName: "Bouchard", sortOrder: 1 },
  });

  const roy = await prisma.artist.upsert({
    where: { id: "seed-artist-roy" },
    update: {},
    create: { id: "seed-artist-roy", name: "Camille Roy", sortOrder: 0 },
  });

  const bergeron = await prisma.artist.upsert({
    where: { id: "seed-artist-bergeron" },
    update: {},
    create: { id: "seed-artist-bergeron", name: "Julien Bergeron", sortOrder: 1 },
  });

  const gagnon = await prisma.artist.upsert({
    where: { id: "seed-artist-gagnon" },
    update: {},
    create: { id: "seed-artist-gagnon", name: "Marie-Ève Gagnon", sortOrder: 2 },
  });

  await prisma.commission.upsert({
    where: { id: "seed-commission-studio" },
    update: {},
    create: { id: "seed-commission-studio", title: "Atelier de l'artiste", rate: 30, sortOrder: 0 },
  });

  await prisma.commission.upsert({
    where: { id: "seed-commission-gallery" },
    update: {},
    create: { id: "seed-commission-gallery", title: "Trouvée en galerie", rate: 40, sortOrder: 1 },
  });

  await prisma.commission.upsert({
    where: { id: "seed-commission-consignment" },
    update: {},
    create: { id: "seed-commission-consignment", title: "Consignation externe", rate: 50, sortOrder: 2 },
  });

  const original = await prisma.category.upsert({
    where: { id: "seed-category-original" },
    update: {},
    create: { id: "seed-category-original", name: "Original", sortOrder: 0 },
  });

  const print = await prisma.category.upsert({
    where: { id: "seed-category-print" },
    update: {},
    create: { id: "seed-category-print", name: "Print", sortOrder: 1 },
  });

  await prisma.category.upsert({
    where: { id: "seed-category-stickers" },
    update: {},
    create: { id: "seed-category-stickers", name: "Stickers", sortOrder: 2 },
  });

  await prisma.category.upsert({
    where: { id: "seed-category-tshirt" },
    update: {},
    create: { id: "seed-category-tshirt", name: "T-shirt", sortOrder: 3 },
  });

  await prisma.article.upsert({
    where: { id: "seed-article-1" },
    update: { categoryId: original.id },
    create: {
      id: "seed-article-1",
      title: "Marée haute",
      categoryId: original.id,
      price: 850,
      artistId: roy.id,
      sortOrder: 0,
    },
  });

  await prisma.article.upsert({
    where: { id: "seed-article-2" },
    update: { categoryId: print.id },
    create: {
      id: "seed-article-2",
      title: "Marée haute (print)",
      categoryId: print.id,
      price: 65,
      artistId: roy.id,
      sortOrder: 1,
    },
  });

  await prisma.article.upsert({
    where: { id: "seed-article-3" },
    update: { categoryId: original.id },
    create: {
      id: "seed-article-3",
      title: "Nocturne no. 4",
      categoryId: original.id,
      price: 1200,
      artistId: bergeron.id,
      sortOrder: 2,
    },
  });

  await prisma.article.upsert({
    where: { id: "seed-article-4" },
    update: {},
    create: {
      id: "seed-article-4",
      title: "Carte postale collector",
      price: 8,
      taxable: false,
      artistId: gagnon.id,
      sortOrder: 3,
    },
  });

  console.log(
    "Seeded 2 employés + 3 artistes + 3 commissions + 4 catégories + 4 articles."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
