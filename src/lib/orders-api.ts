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
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    deliveryDate?: string;
    deliveryInstructions?: string;
    recipientPhone?: string;
    deliveryMethod: "pickup" | "delivery";
  };
  customName: string;
  customMessage: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
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
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    deliveryDate?: string;
    deliveryInstructions?: string;
    recipientPhone?: string;
    deliveryMethod: "pickup" | "delivery";
  };
  customName: string;
  customMessage: string;
  items: Array<{
    productId: string;
    quantity: number;
    colorId?: string | null;
  }>;
}

interface ApiOrderResponse {
  ok: boolean;
  order?: ApiOrder;
  error?: string;
}

interface ApiOrdersResponse {
  ok: boolean;
  orders?: ApiOrder[];
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

export async function getAdminOrders(): Promise<ApiOrder[]> {
  const response = await fetch("/api/admin/orders", {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json().catch(() => null) as ApiOrdersResponse | null;

  if (!response.ok || !data?.ok || !data.orders) {
    throw new Error(data?.error || "Could not load orders");
  }

  return data.orders;
}

export async function getAdminOrder(reference: string): Promise<ApiOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json().catch(() => null) as ApiOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Order not found");
  }

  return data.order;
}

export async function updateAdminOrderStatus(
  reference: string,
  status: OrderStatus
): Promise<ApiOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => null) as ApiOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Could not update order status");
  }

  return data.order;
}
