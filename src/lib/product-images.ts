import type { Product } from "@/types";

/**
 * Mapping temporaire nom produit → chemin image local.
 *
 * Ce mapping est un FALLBACK de développement uniquement.
 * Il sert tant que products.image_url est encore vide en base.
 *
 * Priorité :
 *   1. product.imageUrl (valeur DB) — prioritaire, toujours
 *   2. Chemin local via ce mapping — tant que DB vide
 *   3. Chaîne vide — si aucune correspondance
 *
 * Une fois le SQL `UPDATE products SET image_url = ...` exécuté en prod,
 * product.imageUrl sera rempli et ce mapping ne sera plus jamais utilisé.
 */
const LOCAL_IMAGE_MAP: Record<string, string> = {
  // ── Add-on product thumbnails (used in FlowerSelector / BalloonSelector) ──
  // Bucket images removed — bucket selection is now driven by design presets.
  "Rose":  "/products/flowers/rose.png",
  "Heart": "/products/balloons/heart.png",
  // Peony, Tulip, Star → no validated image yet → fallback CSS in selectors
};

/**
 * Retourne l'URL de l'image à utiliser pour un produit.
 *
 * @param product - Produit issu du catalogue
 * @returns URL de l'image (DB, fallback local, ou chaîne vide)
 */
export function getProductImageUrl(product: Pick<Product, "name" | "imageUrl">): string {
  // 1. Priorité DB
  if (product.imageUrl) return product.imageUrl;

  // 2. Fallback local (tant que DB vide)
  return LOCAL_IMAGE_MAP[product.name] ?? "";
}
