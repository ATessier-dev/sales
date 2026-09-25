// Article.imageUrl pointe vers un blob Vercel privé, jamais directement
// chargeable dans un <img> : toutes les vues passent par cette route proxy
// authentifiée (voir app/api/articles/image/route.ts).
export function articleImageSrc(imageUrl: string): string {
  return `/api/articles/image?url=${encodeURIComponent(imageUrl)}`;
}
