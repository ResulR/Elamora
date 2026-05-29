import type { Product } from "@/types";

// Minimal placeholder catalog.
// TODO: connect to backend and remove hardcoded items once product management is ready.

export const buckets: Product[] = [
  { id: "bucket-classic", name: "Classic Bucket", category: "bucket", price: 1900, active: true },
  { id: "bucket-premium", name: "Premium Bucket", category: "bucket", price: 2900, active: true },
];

export const flowers: Product[] = [
  { id: "flower-rose", name: "Rose", category: "flower", price: 300, active: true },
  { id: "flower-peony", name: "Peony", category: "flower", price: 450, active: true },
  { id: "flower-tulip", name: "Tulip", category: "flower", price: 250, active: true },
];

export const balloons: Product[] = [
  { id: "balloon-heart", name: "Heart", category: "balloon", price: 200, active: true },
  { id: "balloon-star", name: "Star", category: "balloon", price: 200, active: true },
];

export const colors: Product[] = [
  { id: "color-blush", name: "Blush", category: "color", price: 0, colorHex: "#f4c6c6", active: true },
  { id: "color-cream", name: "Cream", category: "color", price: 0, colorHex: "#f4e7d3", active: true },
  { id: "color-sage", name: "Sage", category: "color", price: 0, colorHex: "#b8c9a8", active: true },
  { id: "color-mauve", name: "Mauve", category: "color", price: 0, colorHex: "#c9a0c4", active: true },
];

export const allProducts: Product[] = [...buckets, ...flowers, ...balloons, ...colors];

export function findProduct(id: string | null | undefined): Product | undefined {
  if (!id) return undefined;
  return allProducts.find((p) => p.id === id);
}
