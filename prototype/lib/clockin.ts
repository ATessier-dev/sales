import { withPrisma } from "@/lib/withPrisma";

// L'app d'horaire (clockin) expose la liste de ses employés actifs pour des
// intégrations externes sans session propre (voir son
// app/api/public/employees/route.ts et lib/auth/requireApiKey.ts) ; CAISSE_API_KEY
// est le même secret partagé des deux côtés.
const CLOCKIN_EMPLOYEES_URL = "https://schedule.loriginal.org/api/public/employees";

type ClockinEmployee = { id: string; firstName: string; lastName: string };

export type ImportResult = { created: number; updated: number };

/// Appelée uniquement côté serveur (route API, jamais depuis le navigateur)
/// pour que CAISSE_API_KEY ne transite jamais jusqu'au client. N'ajoute que
/// les employés absents (par externalId) et resynchronise le nom de ceux
/// déjà importés ; ne touche jamais active/sortOrder/commissionRate d'un
/// employé existant, laissés sous contrôle manuel du superviseur.
export async function importEmployeesFromClockin(): Promise<ImportResult> {
  const apiKey = process.env.CAISSE_API_KEY;
  if (!apiKey) {
    throw new Error("CAISSE_API_KEY environment variable is not defined");
  }

  const response = await fetch(CLOCKIN_EMPLOYEES_URL, { headers: { "x-api-key": apiKey } });
  if (!response.ok) {
    throw new Error(`clockin employees fetch failed with status ${response.status}`);
  }

  const body = (await response.json()) as { employees: ClockinEmployee[] };

  let created = 0;
  let updated = 0;

  for (const clockinEmployee of body.employees) {
    const existing = await withPrisma((prisma) =>
      prisma.employee.findUnique({ where: { externalId: clockinEmployee.id } })
    );

    if (existing) {
      if (existing.firstName !== clockinEmployee.firstName || existing.lastName !== clockinEmployee.lastName) {
        await withPrisma((prisma) =>
          prisma.employee.update({
            where: { id: existing.id },
            data: { firstName: clockinEmployee.firstName, lastName: clockinEmployee.lastName },
          })
        );
        updated += 1;
      }
      continue;
    }

    const lastEmployee = await withPrisma((prisma) =>
      prisma.employee.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    await withPrisma((prisma) =>
      prisma.employee.create({
        data: {
          externalId: clockinEmployee.id,
          firstName: clockinEmployee.firstName,
          lastName: clockinEmployee.lastName,
          sortOrder: (lastEmployee?.sortOrder ?? -1) + 1,
        },
      })
    );
    created += 1;
  }

  return { created, updated };
}
