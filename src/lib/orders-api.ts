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
    deliveryTimeSlot?: string;
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
  paymentStatus: string;
  paymentProvider: string;
  paymentReference: string;
  paidAt: string | null;
  trackingNumber: string;
  trackingCarrier: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  confirmationToken?: string;
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
    deliveryTimeSlot?: string;
    deliveryInstructions?: string;
    recipientPhone?: string;
    deliveryMethod: "pickup" | "delivery";
  };
  customName: string;
  customMessage: string;
  termsAccepted: boolean;
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

export interface AdminOrdersPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiOrdersResponse {
  ok: boolean;
  orders?: ApiOrder[];
  pagination?: AdminOrdersPagination;
  error?: string;
}

export interface AdminOrdersFilters {
  status?: string;
  paymentStatus?: string;
  deliveryMethod?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminOrdersResult {
  orders: ApiOrder[];
  pagination: AdminOrdersPagination;
}

export interface BankTransferInfo {
  beneficiary: string;
  bankName: string;
  iban: string;
  currency: string;
}

interface BankTransferInfoResponse {
  ok: boolean;
  bankTransfer?: BankTransferInfo;
  error?: string;
}

export async function getBankTransferInfo(): Promise<BankTransferInfo> {
  const response = await fetch("/api/bank-transfer-info", {
    method: "GET",
  });

  const data = await response.json().catch(() => null) as BankTransferInfoResponse | null;

  if (!response.ok || !data?.ok || !data.bankTransfer) {
    throw new Error(data?.error || "Could not load bank transfer info");
  }

  return data.bankTransfer;
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

export async function getPublicOrder(reference: string, token: string): Promise<ApiOrder> {
  const response = await fetch(
    `/api/orders/confirmation/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
    }
  );

  const data = await response.json().catch(() => null) as ApiOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Order not found");
  }

  return data.order;
}

function buildAdminOrdersQuery(filters: AdminOrdersFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `/api/admin/orders?${query}` : "/api/admin/orders";
}


export function buildAdminOrdersExportUrl(
  filters: AdminOrdersFilters = {},
  format: "csv" | "excel" = "csv"
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      key === "page" ||
      key === "pageSize" ||
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    ) {
      return;
    }

    params.set(key, String(value));
  });

  if (format === "excel") {
    params.set("format", "excel");
  }

  const query = params.toString();
  return query ? `/api/admin/orders/export.csv?${query}` : "/api/admin/orders/export.csv";
}

export async function getAdminOrdersPage(
  filters: AdminOrdersFilters = {}
): Promise<AdminOrdersResult> {
  const response = await fetch(buildAdminOrdersQuery(filters), {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json().catch(() => null) as ApiOrdersResponse | null;

  if (!response.ok || !data?.ok || !data.orders) {
    throw new Error(data?.error || "Could not load orders");
  }

  return {
    orders: data.orders,
    pagination: data.pagination ?? {
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? data.orders.length,
      total: data.orders.length,
      totalPages: 1,
    },
  };
}

export async function getAdminOrders(): Promise<ApiOrder[]> {
  const result = await getAdminOrdersPage();
  return result.orders;
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

export async function updateAdminOrderPaymentStatus(
  reference: string,
  paymentStatus: "pending" | "paid" | "cancelled" | "refunded"
): Promise<ApiOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}/payment-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ paymentStatus }),
  });

  const data = await response.json().catch(() => null) as ApiOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Could not update payment status");
  }

  return data.order;
}

export async function updateAdminOrderStatus(
  reference: string,
  status: OrderStatus,
  payload: { trackingNumber?: string; trackingCarrier?: string } = {}
): Promise<ApiOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ status, ...payload }),
  });

  const data = await response.json().catch(() => null) as ApiOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Could not update order status");
  }

  return data.order;
}
