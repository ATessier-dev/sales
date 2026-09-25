import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { hashCode } from "../lib/auth-utils";

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
  // Login looks the employee up by `code` directly (findUnique), so the hash
  // must be of that same value — not a separate secret. See the plan's auth
  // design: POST /api/auth/login { code } → findUnique({ code }) →
  // argon2.verify(code, codeHash).
  const employeeCodeHash = await hashCode("EMP001");
  await prisma.employee.upsert({
    where: { code: "EMP001" },
    update: { codeHash: employeeCodeHash },
    create: {
      code: "EMP001",
      codeHash: employeeCodeHash,
      firstName: "Alex",
      lastName: "Tremblay",
      role: "EMPLOYEE",
    },
  });

  const superuserCodeHash = await hashCode("SUP001");
  await prisma.employee.upsert({
    where: { code: "SUP001" },
    update: { codeHash: superuserCodeHash },
    create: {
      code: "SUP001",
      codeHash: superuserCodeHash,
      firstName: "Sam",
      lastName: "Bouchard",
      role: "SUPERUSER",
    },
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

  await prisma.article.upsert({
    where: { id: "seed-article-1" },
    update: {},
    create: {
      id: "seed-article-1",
      title: "Marée haute",
      type: "ORIGINAL",
      price: 850,
      artistId: roy.id,
      sortOrder: 0,
    },
  });

  await prisma.article.upsert({
    where: { id: "seed-article-2" },
    update: {},
    create: {
      id: "seed-article-2",
      title: "Marée haute (print)",
      type: "PRINT",
      price: 65,
      artistId: roy.id,
      sortOrder: 1,
    },
  });

  await prisma.article.upsert({
    where: { id: "seed-article-3" },
    update: {},
    create: {
      id: "seed-article-3",
      title: "Nocturne no. 4",
      type: "ORIGINAL",
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
      type: "OTHER",
      price: 8,
      taxable: false,
      artistId: gagnon.id,
      sortOrder: 3,
    },
  });

  console.log("Seeded 2 comptes de test (EMP001 / SUP001) + 3 artistes + 3 commissions + 4 articles.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
