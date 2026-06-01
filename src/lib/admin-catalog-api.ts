import type { Product } from "@/types";

type AdminCatalogProductApi = {
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

type AdminCatalogColorApi = {
  id: string;
  name: string;
  hexCode: string;
  sortOrder: number;
  isActive: boolean;
};

type AdminCatalogApiResponse = {
  ok: boolean;
  products: AdminCatalogProductApi[];
  colors: AdminCatalogColorApi[];
  error?: string;
};

export type AdminCatalogData = {
  products: Product[];
  colors: Product[];
  allProducts: Product[];
};

export async function fetchAdminCatalog(): Promise<AdminCatalogData> {
  const response = await fetch("/api/admin/catalog", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as AdminCatalogApiResponse | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Could not load admin catalog");
  }

  const products = payload.products.map((product) => ({
    id: toAdminProductId(product.category, product.name),
    dbId: product.id,
    name: product.name,
    category: product.category,
    price: product.priceCents,
    imageUrl: product.imageUrl || undefined,
    active: product.isActive,
  }));

  const colors = payload.colors.map((color) => ({
    id: toAdminProductId("color", color.name),
    dbId: color.id,
    name: color.name,
    category: "color" as const,
    price: 0,
    colorHex: color.hexCode,
    active: color.isActive,
  }));

  return {
    products,
    colors,
    allProducts: [...products, ...colors],
  };
}

function toAdminProductId(category: Product["category"], name: string) {
  return `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
