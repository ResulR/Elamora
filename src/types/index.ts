// Shared domain types for the bucket configurator.
// TODO: extend / move to per-domain files once features are wired.

export type ProductCategory = "bucket" | "flower" | "balloon" | "plush" | "color";

export interface Product {
  id: string;
  dbId?: string;
  name: string;
  category: ProductCategory;
  price: number; // in cents
  imageUrl?: string;
  colorHex?: string;
  active: boolean;
}

export interface BucketConfiguration {
  // v2: designId is the primary selector. bucketId is auto-resolved from
  // the design's bridgeBucketName and kept for checkout compatibility.
  designId: string | null;
  bucketId: string | null;
  flowerIds: string[];
  balloonIds: string[];
  colorId: string | null;
  firstName: string;
  message: string;
  ribbonColor: string;
  customRequests: string;
}

export type OrderStatus =
  | "pending_bank_transfer"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export interface CustomerInfo {
  firstName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface Order {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  customer: CustomerInfo;
  configuration: BucketConfiguration;
  totalPrice: number;
  internalNotes?: string;
}

export interface ShopSettings {
  shopName: string;
  currency: string;
  deliveryFee: number;
  openingHours: string;
  confirmationMessage: string;
  ordersEnabled: boolean;
}
