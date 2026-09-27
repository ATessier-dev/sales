import { withPrisma } from "@/lib/withPrisma";

/// Taux modifiables par le superuser dans /settings (voir TaxRate en base),
/// plutôt que des constantes fixes. Upsert sur lecture pour garantir qu'une
/// ligne existe toujours, sans dépendre d'un seed. Retourne des pourcentages
/// (ex. 5 pour 5%), comme Commission.rate et Employee.commissionRate.
/// Serveur uniquement (importe withPrisma) : voir lib/tax.ts pour
/// roundToCents, la partie sans dépendance importable côté client.
export async function getTaxRates(): Promise<{ gstRate: number; qstRate: number }> {
  const taxRate = await withPrisma((prisma) =>
    prisma.taxRate.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } })
  );
  return { gstRate: Number(taxRate.gstRate), qstRate: Number(taxRate.qstRate) };
}
