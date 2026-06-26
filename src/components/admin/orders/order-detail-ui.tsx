import type { ReactNode } from "react";
import type { ApiAdminOrder } from "@/lib/orders-api";
import { formatDate } from "@/lib/format";
import type { OrderStatus } from "@/types";

export function OrderDetailCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-surface/80 border border-border/60 rounded-2xl p-4 md:p-5 shadow-soft">
      <h2 className="font-display text-xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function OrderInfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-right break-words min-w-0">
        {value}
      </span>
    </div>
  );
}

export function OrderStatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  return (
    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">
      {formatOrderStatus(status)}
    </span>
  );
}

export function OrderSimpleBadge({
  value,
}: {
  value: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function OrderAddressBlock({
  order,
}: {
  order: ApiAdminOrder;
}) {
  const lines = [
    order.customer.address || order.customer.addressLine1,
    order.customer.addressLine2,
    [order.customer.postalCode, order.customer.city]
      .filter(Boolean)
      .join(" "),
    order.customer.country,
  ].filter(Boolean) as string[];

  const hasRealAddress = lines.some(
    (line) => line !== order.customer.country
  );

  if (lines.length === 0 || !hasRealAddress) {
    return order.customer.deliveryMethod === "pickup"
      ? "Pickup location to be confirmed"
      : "-";
  }

  return (
    <span className="block text-right">
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </span>
  );
}

export function formatPaymentStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function formatPaymentProvider(provider: string) {
  if (!provider || provider === "bank_transfer") {
    return "Bank transfer";
  }

  return provider.replaceAll("_", " ");
}

export function formatDeliveryMethod(method: string) {
  return method === "delivery" ? "Delivery" : "Pickup";
}

export function formatOptionalDate(value?: string) {
  return value ? formatDate(value) : "-";
}

export function formatOrderStatus(status: OrderStatus) {
  if (status === "pending_bank_transfer") {
    return "Awaiting bank transfer";
  }

  return status.replaceAll("_", " ");
}
