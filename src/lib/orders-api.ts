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

export interface ApiOrderBase {
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
  createdAt: string;
  updatedAt: string;
  items?: ApiOrderItem[];
}

export interface ApiPublicOrder extends ApiOrderBase {
  confirmationToken?: string;
}

export interface ApiAdminOrder extends ApiOrderBase {
  internalNotes: string;
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

interface ApiPublicOrderResponse {
  ok: boolean;
  order?: ApiPublicOrder;
  error?: string;
}

interface ApiAdminOrderResponse {
  ok: boolean;
  order?: ApiAdminOrder;
  error?: string;
}

interface ApiOkResponse {
  ok: boolean;
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
  orders?: ApiAdminOrder[];
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
  orders: ApiAdminOrder[];
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

export async function createDatabaseOrder(payload: CreateOrderPayload): Promise<ApiPublicOrder> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null) as ApiPublicOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Could not create order");
  }

  return data.order;
}

export async function getPublicOrder(reference: string, token: string): Promise<ApiPublicOrder> {
  const response = await fetch(
    `/api/orders/confirmation/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
    }
  );

  const data = await response.json().catch(() => null) as ApiPublicOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Order not found");
  }

  return data.order;
}

export async function requestOrderRecapEmail(reference: string, token: string): Promise<void> {
  const response = await fetch(
    `/api/orders/confirmation/${encodeURIComponent(reference)}/resend-email?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
    }
  );

  const data = await response.json().catch(() => null) as ApiOkResponse | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Could not send recap email");
  }
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

export interface BulkMarkPaidResult {
  requested: number;
  updated: number;
  alreadyPaid: number;
  missing: number;
  updatedReferences: string[];
  alreadyPaidReferences: string[];
  missingReferences: string[];
}

interface BulkMarkPaidResponse {
  ok: boolean;
  result?: BulkMarkPaidResult;
  error?: string;
}

export function buildSelectedOrdersExportUrl(
  references: string[],
  format: "csv" | "excel" = "csv"
) {
  const params = new URLSearchParams();
  params.set("references", [...new Set(references)].join(","));

  if (format === "excel") {
    params.set("format", "excel");
  }

  return `/api/admin/orders/export.csv?${params.toString()}`;
}

export async function markAdminOrdersPaid(
  references: string[]
): Promise<BulkMarkPaidResult> {
  const response = await fetch("/api/admin/orders/bulk/mark-paid", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      references: [...new Set(references)],
    }),
  });

  const data = await response.json().catch(() => null) as BulkMarkPaidResponse | null;

  if (!response.ok || !data?.ok || !data.result) {
    throw new Error(data?.error || "Could not mark selected orders as paid");
  }

  return data.result;
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

export async function getAdminOrders(): Promise<ApiAdminOrder[]> {
  const result = await getAdminOrdersPage();
  return result.orders;
}

export async function getAdminOrder(reference: string): Promise<ApiAdminOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json().catch(() => null) as ApiAdminOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Order not found");
  }

  return data.order;
}

export async function updateAdminOrderPaymentStatus(
  reference: string,
  paymentStatus: "pending" | "paid" | "cancelled" | "refunded"
): Promise<ApiAdminOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}/payment-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ paymentStatus }),
  });

  const data = await response.json().catch(() => null) as ApiAdminOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Could not update payment status");
  }

  return data.order;
}

export async function sendAdminOrderPaymentReminder(reference: string): Promise<void> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}/payment-reminder`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json().catch(() => null) as ApiOkResponse | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Could not send payment reminder");
  }
}

export async function updateAdminOrderStatus(
  reference: string,
  status: OrderStatus,
  payload: { trackingNumber?: string; trackingCarrier?: string } = {}
): Promise<ApiAdminOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ status, ...payload }),
  });

  const data = await response.json().catch(() => null) as ApiAdminOrderResponse | null;

  if (!response.ok || !data?.ok || !data.order) {
    throw new Error(data?.error || "Could not update order status");
  }

  return data.order;
}
