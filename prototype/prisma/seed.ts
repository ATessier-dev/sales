import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { hashCode } from "../lib/auth-utils";

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
    create: { id: "seed-artist-roy", name: "Camille Roy", commissionRate: 30, sortOrder: 0 },
  });

  const bergeron = await prisma.artist.upsert({
    where: { id: "seed-artist-bergeron" },
    update: {},
    create: { id: "seed-artist-bergeron", name: "Julien Bergeron", commissionRate: 40, sortOrder: 1 },
  });

  const gagnon = await prisma.artist.upsert({
    where: { id: "seed-artist-gagnon" },
    update: {},
    create: { id: "seed-artist-gagnon", name: "Marie-Ève Gagnon", commissionRate: 35, sortOrder: 2 },
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

  console.log("Seeded 2 comptes de test (EMP001 / SUP001) + 3 artistes + 4 articles.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
