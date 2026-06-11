import type { Product } from "@/types";

export type AdminProductCategory = "bucket" | "flower" | "balloon" | "plush";

export type AdminCatalogProductApi = {
  id: string;
  category: AdminProductCategory;
  categoryName: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type AdminCatalogColorApi = {
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

type AdminProductResponse = {
  ok: boolean;
  product?: AdminCatalogProductApi;
  imageUrl?: string;
  error?: string;
};

export type AdminCatalogData = {
  products: Product[];
  colors: Product[];
  allProducts: Product[];
  rawProducts: AdminCatalogProductApi[];
  rawColors: AdminCatalogColorApi[];
};

export type AdminProductPayload = {
  categoryCode: AdminProductCategory;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
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

  const products = payload.products.map((product) => mapAdminProductToProduct(product));

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
    rawProducts: payload.products,
    rawColors: payload.colors,
  };
}

export async function createAdminProduct(payload: AdminProductPayload) {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseProductResponse(response, "Could not create product");
}

export async function updateAdminProduct(id: string, payload: Partial<AdminProductPayload>) {
  const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseProductResponse(response, "Could not update product");
}

export async function updateAdminProductActive(id: string, isActive: boolean) {
  const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}/active`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ isActive }),
  });

  const payload = (await response.json().catch(() => null)) as AdminProductResponse | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Could not update product status");
  }
}

export async function uploadAdminProductImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}/image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as AdminProductResponse | null;

  if (!response.ok || !payload?.ok || !payload.imageUrl) {
    throw new Error(payload?.error || "Could not upload image");
  }

  return payload.imageUrl;
}

function mapAdminProductToProduct(product: AdminCatalogProductApi): Product {
  return {
    id: toAdminProductId(product.category, product.name),
    dbId: product.id,
    name: product.name,
    category: product.category,
    price: product.priceCents,
    imageUrl: product.imageUrl || undefined,
    active: product.isActive,
  };
}

async function parseProductResponse(response: Response, fallbackError: string) {
  const payload = (await response.json().catch(() => null)) as AdminProductResponse | null;

  if (!response.ok || !payload?.ok || !payload.product) {
    throw new Error(payload?.error || fallbackError);
  }

  return payload.product;
}

function toAdminProductId(category: Product["category"], name: string) {
  return `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
