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

export const emptyCatalog: CatalogData = {
  buckets: [],
  flowers: [],
  balloons: [],
  colors: [],
  allProducts: [],
};

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
    id: product.id,
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
    id: color.id,
    dbId: color.id,
    name: color.name,
    category: "color",
    price: 0,
    colorHex: color.hexCode,
    active: color.isActive,
  };
}
