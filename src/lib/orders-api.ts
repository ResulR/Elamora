import type { OrderStatus } from "@/types";

export interface ApiOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  colorId: string | null;
  colorName: string;
  colorHex: string;
  createdAt: string;
}

export interface ApiOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    deliveryMethod: "pickup" | "delivery";
  };
  customName: string;
  customMessage: string;
  totalCents: number;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  items?: ApiOrderItem[];
}

export interface CreateOrderPayload {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    deliveryMethod: "pickup" | "delivery";
  };
  customName: string;
  customMessage: string;
  items: Array<{
    productName: string;
    unitPriceCents: number;
    quantity: number;
    colorName?: string;
    colorHex?: string;
  }>;
}

interface ApiOrderResponse {
  ok: boolean;
  order?: ApiOrder;
  error?: string;
}

export async function createDatabaseOrder(payload: CreateOrderPayload): Promise<ApiOrder> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null) as ApiOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Could not create order");
  }

  return data.order;
}

export async function getPublicOrder(reference: string): Promise<ApiOrder> {
  const response = await fetch(`/api/orders/${encodeURIComponent(reference)}`, {
    method: "GET",
  });

  const data = await response.json().catch(() => null) as ApiOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Order not found");
  }

  return data.order;
}
