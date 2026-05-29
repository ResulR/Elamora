import { findProduct } from "@/data/catalog";
import type { BucketConfiguration, OrderStatus } from "@/types";

export const ORDERS_STORAGE_KEY = "elamora_orders";
export const LATEST_ORDER_REFERENCE_KEY = "elamora_latest_order_reference";

export interface CheckoutCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  deliveryMethod: "pickup" | "delivery";
}

export interface LocalOrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
}

export interface LocalOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  customer: CheckoutCustomerInput;
  configuration: BucketConfiguration;
  items: LocalOrderItem[];
  totalCents: number;
  createdAt: string;
}

export function loadOrders(): LocalOrder[] {
  const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as LocalOrder[] : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: LocalOrder[]) {
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export function createLocalOrder(
  config: BucketConfiguration,
  customer: CheckoutCustomerInput
): LocalOrder {
  const existingOrders = loadOrders();
  const reference = generateOrderReference(existingOrders.length + 1);

  const items = buildOrderItems(config);
  const totalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  const order: LocalOrder = {
    id: createLocalId(),
    reference,
    status: "pending",
    customer,
    configuration: config,
    items,
    totalCents,
    createdAt: new Date().toISOString(),
  };

  saveOrders([order, ...existingOrders]);
  window.localStorage.setItem(LATEST_ORDER_REFERENCE_KEY, reference);

  return order;
}

export function loadLatestOrder(): LocalOrder | null {
  const latestReference = window.localStorage.getItem(LATEST_ORDER_REFERENCE_KEY);
  if (!latestReference) return null;

  return loadOrders().find((order) => order.reference === latestReference) ?? null;
}

export function findLocalOrder(reference: string): LocalOrder | null {
  return loadOrders().find((order) => order.reference === reference) ?? null;
}

function buildOrderItems(config: BucketConfiguration): LocalOrderItem[] {
  const productIds = [
    config.bucketId,
    ...config.flowerIds,
    ...config.balloonIds,
  ].filter(Boolean) as string[];

  return productIds
    .map((productId) => {
      const product = findProduct(productId);
      if (!product) return null;

      return {
        id: createLocalId(),
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.price,
        quantity: 1,
      };
    })
    .filter((item): item is LocalOrderItem => item !== null);
}

function generateOrderReference(nextNumber: number): string {
  return `ELA-${String(nextNumber).padStart(6, "0")}`;
}


function createLocalId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
