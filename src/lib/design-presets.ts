/**
 * Gift design presets — frontend-only for v1.
 *
 * Each preset maps to a complete gift composition with a realistic photo.
 * `bridgeBucketName` is a TEMPORARY bridge to make the existing checkout
 * work by linking a design to a DB product. Do NOT build business logic
 * around this field — it will be replaced when a proper `designs` table
 * is added to the backend.
 */
export type GiftDesign = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  basePriceCents: number;
  occasionTags: string[];
  palette: string;
  includes: string;
  bridgeBucketName: "Classic Bucket" | "Premium Bucket";
};

export const DESIGN_PRESETS: GiftDesign[] = [
  {
    id: "classic-romantic-bucket",
    name: "Classic Romantic Bucket",
    description: "A soft romantic bucket with roses and a blush heart balloon.",
    imageUrl: "/designs/classic-romantic-bucket.webp",
    basePriceCents: 3900,
    occasionTags: ["Birthday", "Love", "Anniversary"],
    palette: "Blush",
    includes: "Pastel bucket · Roses · Heart balloon",
    bridgeBucketName: "Classic Bucket",
  },
  {
    id: "premium-ivory-composition",
    name: "Premium Ivory Composition",
    description: "A refined ivory and gold arrangement with peonies and a star balloon.",
    imageUrl: "/designs/premium-ivory-composition.webp",
    basePriceCents: 5900,
    occasionTags: ["Birthday", "Wedding", "Celebration"],
    palette: "Cream",
    includes: "Premium bucket · Peonies · Star balloon",
    bridgeBucketName: "Premium Bucket",
  },
  {
    id: "baby-girl-welcome",
    name: "Baby Girl Welcome",
    description: "A pastel pink newborn gift with plush details and a bubble balloon.",
    imageUrl: "/designs/baby-girl-welcome.webp",
    basePriceCents: 6500,
    occasionTags: ["Birth", "Baby shower", "New baby"],
    palette: "Blush",
    includes: "Baby box · Plush · Flowers · Bubble balloon",
    bridgeBucketName: "Premium Bucket",
  },
  {
    id: "baby-boy-welcome",
    name: "Baby Boy Welcome",
    description: "A soft blue newborn composition with plush details and a bubble balloon.",
    imageUrl: "/designs/baby-boy-welcome.webp",
    basePriceCents: 6500,
    occasionTags: ["Birth", "Baby shower", "New baby"],
    palette: "Cream",
    includes: "Baby box · Plush · Flowers · Bubble balloon",
    bridgeBucketName: "Premium Bucket",
  },
  {
    id: "couple-celebration",
    name: "Couple Celebration",
    description: "A romantic couple gift with elegant glasses, roses and a blush balloon.",
    imageUrl: "/designs/couple-celebration.webp",
    basePriceCents: 5500,
    occasionTags: ["Love", "Wedding", "Anniversary"],
    palette: "Cream",
    includes: "Couple glasses · Roses · Heart balloon",
    bridgeBucketName: "Premium Bucket",
  },
];

export function findDesignById(id: string | null | undefined): GiftDesign | undefined {
  if (!id) return undefined;
  return DESIGN_PRESETS.find((d) => d.id === id);
}
