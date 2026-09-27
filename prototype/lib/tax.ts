// Pur et sans dépendance serveur (contrairement à getTaxRates dans
// lib/taxRates.ts) : importable depuis un composant client comme posView.tsx
// sans entraîner Prisma/ws dans le bundle navigateur.
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
