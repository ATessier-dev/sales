// Taux de TPS/TVQ (Québec). Les œuvres/articles vendus ici ne bénéficient
// d'aucune exemption connue à ce jour — si ça change, c'est le seul endroit à
// ajuster (voir Article.taxable pour exclure un article donné des deux taxes).
export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;

export function computeTax(taxableSubtotal: number): { gst: number; qst: number; total: number } {
  const gst = roundToCents(taxableSubtotal * GST_RATE);
  const qst = roundToCents(taxableSubtotal * QST_RATE);
  return { gst, qst, total: roundToCents(gst + qst) };
}

export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
