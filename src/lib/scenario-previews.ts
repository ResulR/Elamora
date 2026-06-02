import type { BucketConfiguration, Product } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "Classic Bucket" → "classic-bucket" */
function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// ─── Map ──────────────────────────────────────────────────────────────────────
// Format : "bucket-slug/flower-slug/balloon-slug"
// "none" = non sélectionné
// Extension : ajouter des lignes ici quand Premium Bucket sera généré.

const SCENARIO_PREVIEW_MAP: Record<string, string> = {
  // Classic Bucket — bucket seul
  "classic-bucket/none/none":   "/scenario-previews/classic-bucket/base.png",

  // Classic Bucket + flower seul (sans balloon)
  "classic-bucket/rose/none":   "/scenario-previews/classic-bucket/rose.png",
  "classic-bucket/peony/none":  "/scenario-previews/classic-bucket/peony.png",
  "classic-bucket/tulip/none":  "/scenario-previews/classic-bucket/tulip.png",

  // Classic Bucket + Rose + Balloon
  "classic-bucket/rose/heart":  "/scenario-previews/classic-bucket/rose-heart.png",
  "classic-bucket/rose/star":   "/scenario-previews/classic-bucket/rose-star.png",

  // Classic Bucket + Peony + Balloon
  "classic-bucket/peony/heart": "/scenario-previews/classic-bucket/peony-heart.png",
  "classic-bucket/peony/star":  "/scenario-previews/classic-bucket/peony-star.png",

  // Classic Bucket + Tulip + Balloon
  "classic-bucket/tulip/heart": "/scenario-previews/classic-bucket/tulip-heart.png",
  "classic-bucket/tulip/star":  "/scenario-previews/classic-bucket/tulip-star.png",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScenarioResult = {
  imageUrl: string;
  /** true = image exacte pour la sélection, false = fallback partiel */
  exact: boolean;
};

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Retourne l'image de preview la plus précise disponible pour la config actuelle.
 *
 * Fallback progressif :
 *   1. bucket + first flower + first balloon (exact)
 *   2. bucket + first flower (sans balloon)
 *   3. bucket seul
 *   4. undefined → le composant affiche un placeholder ou un message "soon"
 *
 * Note : seule la PREMIÈRE flower et le PREMIER balloon pilotent le preview.
 * Les autres sélections restent dans le résumé de commande.
 */
export function getScenarioPreview(
  config: BucketConfiguration,
  findProduct: (id: string | null | undefined) => Product | undefined
): ScenarioResult | undefined {
  const bucket = findProduct(config.bucketId);
  if (!bucket) return undefined;

  const bucketSlug = toSlug(bucket.name);

  const firstFlower  = config.flowerIds.length  > 0 ? findProduct(config.flowerIds[0])  : null;
  const firstBalloon = config.balloonIds.length > 0 ? findProduct(config.balloonIds[0]) : null;

  const flowerSlug  = firstFlower  ? toSlug(firstFlower.name)  : "none";
  const balloonSlug = firstBalloon ? toSlug(firstBalloon.name) : "none";

  const attempts: Array<{ key: string; exact: boolean }> = [
    { key: `${bucketSlug}/${flowerSlug}/${balloonSlug}`, exact: true  },
    { key: `${bucketSlug}/${flowerSlug}/none`,           exact: false },
    { key: `${bucketSlug}/none/none`,                    exact: false },
  ];

  for (const { key, exact } of attempts) {
    const url = SCENARIO_PREVIEW_MAP[key];
    if (url) return { imageUrl: url, exact };
  }

  return undefined; // bucket existe mais pas de scénario pour lui (ex. Premium Bucket)
}

/**
 * Indique si un bucket dispose de scénarios pré-générés.
 * Utile pour afficher un message "Preview coming soon" pour Premium Bucket.
 */
export function hasScenariosForBucket(bucketName: string | undefined): boolean {
  if (!bucketName) return false;
  const slug = toSlug(bucketName);
  return Object.keys(SCENARIO_PREVIEW_MAP).some((k) => k.startsWith(`${slug}/`));
}
