import type { Product } from "@/types";

type CatalogCategoryApi = {
  id: string;
  code: "bucket" | "flower" | "balloon";
  name: string;
  sortOrder: number;
  isActive: boolean;
};

type CatalogProductApi = {
  id: string;
  category: "bucket" | "flower" | "balloon";
  categoryName: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

type CatalogColorApi = {
  id: string;
  name: string;
  hexCode: string;
  sortOrder: number;
  isActive: boolean;
};

type CatalogApiResponse = {
  ok: boolean;
  categories: CatalogCategoryApi[];
  products: CatalogProductApi[];
  colors: CatalogColorApi[];
};

export type CatalogData = {
  buckets: Product[];
  flowers: Product[];
  balloons: Product[];
  colors: Product[];
  allProducts: Product[];
};

const fallbackCatalog: CatalogData = {
  buckets: [
    { id: "bucket-classic", name: "Classic Bucket", category: "bucket", price: 1900, active: true },
    { id: "bucket-premium", name: "Premium Bucket", category: "bucket", price: 2900, active: true },
  ],
  flowers: [
    { id: "flower-rose", name: "Rose", category: "flower", price: 300, active: true },
    { id: "flower-peony", name: "Peony", category: "flower", price: 450, active: true },
    { id: "flower-tulip", name: "Tulip", category: "flower", price: 250, active: true },
  ],
  balloons: [
    { id: "balloon-heart", name: "Heart", category: "balloon", price: 200, active: true },
    { id: "balloon-star", name: "Star", category: "balloon", price: 200, active: true },
  ],
  colors: [
    { id: "color-blush", name: "Blush", category: "color", price: 0, colorHex: "#f4c6c6", active: true },
    { id: "color-cream", name: "Cream", category: "color", price: 0, colorHex: "#f4e7d3", active: true },
    { id: "color-sage", name: "Sage", category: "color", price: 0, colorHex: "#b8c9a8", active: true },
    { id: "color-mauve", name: "Mauve", category: "color", price: 0, colorHex: "#c9a0c4", active: true },
  ],
  allProducts: [],
};

fallbackCatalog.allProducts = [
  ...fallbackCatalog.buckets,
  ...fallbackCatalog.flowers,
  ...fallbackCatalog.balloons,
  ...fallbackCatalog.colors,
];

export function getFallbackCatalog(): CatalogData {
  return fallbackCatalog;
}

export async function fetchCatalog(): Promise<CatalogData> {
  const response = await fetch("/api/catalog", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Could not load catalog");
  }

  const payload = (await response.json()) as CatalogApiResponse;

  if (!payload.ok) {
    throw new Error("Invalid catalog response");
  }

  const products = payload.products
    .filter((product) => product.isActive)
    .map((product) => mapApiProduct(product));

  const colors = payload.colors
    .filter((color) => color.isActive)
    .map((color) => mapApiColor(color));

  const buckets = products.filter((product) => product.category === "bucket");
  const flowers = products.filter((product) => product.category === "flower");
  const balloons = products.filter((product) => product.category === "balloon");

  return {
    buckets,
    flowers,
    balloons,
    colors,
    allProducts: [...buckets, ...flowers, ...balloons, ...colors],
  };
}

function mapApiProduct(product: CatalogProductApi): Product {
  return {
    id: toLegacyProductId(product.category, product.name),
    dbId: product.id,
    name: product.name,
    category: product.category,
    price: product.priceCents,
    imageUrl: product.imageUrl || undefined,
    active: product.isActive,
  };
}

function mapApiColor(color: CatalogColorApi): Product {
  return {
    id: toLegacyProductId("color", color.name),
    dbId: color.id,
    name: color.name,
    category: "color",
    price: 0,
    colorHex: color.hexCode,
    active: color.isActive,
  };
}

function toLegacyProductId(category: Product["category"], name: string) {
  return `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
