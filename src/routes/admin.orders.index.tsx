import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import {
  buildAdminOrdersExportUrl,
  buildSelectedOrdersExportUrl,
  getAdminOrdersPage,
  markAdminOrdersPaid,
  type AdminOrdersPagination,
  type ApiAdminOrder,
} from "@/lib/orders-api";
import { formatDate, formatPrice } from "@/lib/format";
import { CheckCircle2, Download, Search, ShoppingBag } from "lucide-react";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [{ title: "Orders - Admin" }] }),
  component: AdminOrdersPage,
});

const statusFilters: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending_bank_transfer", label: "Awaiting bank transfer" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready_for_pickup", label: "Ready for pickup" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const paymentFilters = [
  { value: "all", label: "All payments" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
] as const;

const deliveryFilters = [
  { value: "all", label: "All modes" },
  { value: "pickup", label: "Pickup" },
  { value: "delivery", label: "Delivery" },
] as const;

const pageSize = 20;

function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [deliveryMethod, setDeliveryMethod] = useState("all");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState<ApiAdminOrder[]>([]);
  const [pagination, setPagination] = useState<AdminOrdersPagination>({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  const filters = useMemo(
    () => ({
      status,
      paymentStatus,
      deliveryMethod,
      q: debouncedQuery,
      dateFrom,
      dateTo,
      page,
      pageSize,
    }),
    [dateFrom, dateTo, debouncedQuery, deliveryMethod, page, paymentStatus, status]
  );

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    getAdminOrdersPage(filters)
      .then((result) => {
        if (cancelled) return;
        setOrders(result.orders);
        setPagination(result.pagination);
        setSelectedReferences([]);
        setLoadError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("Could not load database orders.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setStatus("all");
    setPaymentStatus("all");
    setDeliveryMethod("all");
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const openExport = (format: "csv" | "excel") => {
    window.location.href = buildAdminOrdersExportUrl(
      {
        status,
        paymentStatus,
        deliveryMethod,
        q: debouncedQuery,
        dateFrom,
        dateTo,
      },
      format
    );
  };

  const selectedSet = useMemo(
    () => new Set(selectedReferences),
    [selectedReferences]
  );

  const selectableReferences = useMemo(
    () => orders.map((order) => order.reference),
    [orders]
  );

  const allVisibleSelected =
    selectableReferences.length > 0 &&
    selectableReferences.every((reference) => selectedSet.has(reference));

  const selectedPendingCount = orders.filter(
    (order) =>
      selectedSet.has(order.reference) &&
      order.paymentStatus !== "paid"
  ).length;

  const toggleOrderSelection = (reference: string) => {
    setSelectedReferences((current) =>
      current.includes(reference)
        ? current.filter((item) => item !== reference)
        : [...current, reference]
    );
    setBulkError(null);
    setBulkNotice(null);
  };

  const toggleAllVisible = () => {
    setSelectedReferences(
      allVisibleSelected ? [] : selectableReferences
    );
    setBulkError(null);
    setBulkNotice(null);
  };

  const exportSelected = (format: "csv" | "excel") => {
    if (selectedReferences.length === 0) return;
    window.location.href = buildSelectedOrdersExportUrl(
      selectedReferences,
      format
    );
  };

  const handleMarkSelectedPaid = async () => {
    if (selectedReferences.length === 0) return;

    const confirmed = window.confirm(
      `Mark ${selectedReferences.length} selected order${
        selectedReferences.length === 1 ? "" : "s"
      } as paid? Already paid orders will be ignored.`
    );

    if (!confirmed) return;

    try {
      setIsBulkUpdating(true);
      setBulkError(null);
      setBulkNotice(null);

      const result = await markAdminOrdersPaid(selectedReferences);

      const refreshed = await getAdminOrdersPage(filters);
      setOrders(refreshed.orders);
      setPagination(refreshed.pagination);
      setSelectedReferences([]);

      const parts = [
        `${result.updated} marked as paid`,
        result.alreadyPaid > 0 ? `${result.alreadyPaid} already paid` : null,
        result.missing > 0 ? `${result.missing} not found` : null,
      ].filter(Boolean);

      setBulkNotice(parts.join(" · "));
    } catch (error) {
      console.error(error);
      setBulkError(
        error instanceof Error
          ? error.message
          : "Could not update selected orders"
      );
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const hasActiveFilters =
    status !== "all" ||
    paymentStatus !== "all" ||
    deliveryMethod !== "all" ||
    query.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <AdminLayout title="Orders">
      <section className="bg-surface/80 border border-border/60 rounded-2xl p-3 md:p-5 shadow-soft mb-6">
        <div className="grid lg:grid-cols-[1.2fr_repeat(3,minmax(150px,1fr))] gap-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Search</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  resetPage();
                }}
                placeholder="Reference or email"
                className="h-10 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <SelectFilter
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value as OrderStatus | "all");
              resetPage();
            }}
            options={statusFilters}
          />

          <SelectFilter
            label="Payment"
            value={paymentStatus}
            onChange={(value) => {
              setPaymentStatus(value);
              resetPage();
            }}
            options={paymentFilters}
          />

          <SelectFilter
            label="Mode"
            value={deliveryMethod}
            onChange={(value) => {
              setDeliveryMethod(value);
              resetPage();
            }}
            options={deliveryFilters}
          />
        </div>

        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mt-4 items-end">
          <DateFilter
            label="From"
            value={dateFrom}
            onChange={(value) => {
              setDateFrom(value);
              resetPage();
            }}
          />

          <DateFilter
            label="To"
            value={dateTo}
            onChange={(value) => {
              setDateTo(value);
              resetPage();
            }}
          />

          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="h-10 px-4 rounded-xl border border-border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/60 transition-colors"
          >
            Clear filters
          </button>
        </div>
      </section>

      {bulkError ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bulkError}
        </div>
      ) : null}

      {bulkNotice ? (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {bulkNotice}
        </div>
      ) : null}

      {selectedReferences.length > 0 ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary-soft/25 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-medium text-foreground">
              {selectedReferences.length} order{selectedReferences.length === 1 ? "" : "s"} selected
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedPendingCount} selected order{selectedPendingCount === 1 ? "" : "s"} can be marked as paid.
              Selection applies to the current page only.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isBulkUpdating || selectedPendingCount === 0}
              onClick={handleMarkSelectedPaid}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isBulkUpdating ? "Updating..." : "Mark selected as paid"}
            </button>

            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => exportSelected("csv")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm hover:border-primary/60 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export selected CSV
            </button>

            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => exportSelected("excel")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm hover:border-primary/60 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export selected Excel
            </button>

            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => setSelectedReferences([])}
              className="h-10 rounded-xl px-4 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Clear selection
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-4">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Loading orders..."
            : `${pagination.total} order${pagination.total === 1 ? "" : "s"} found`}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <button
            type="button"
            onClick={() => openExport("csv")}
            className="h-10 px-4 rounded-xl border border-border text-sm hover:border-primary/60 transition-colors"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => openExport("excel")}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Export Excel
          </button>

          <PaginationControls
            pagination={pagination}
            isLoading={isLoading}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading database orders...</p>
      ) : loadError ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Could not load orders"
          description={loadError}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title={hasActiveFilters ? "No orders match these filters" : "No orders yet"}
          description={
            hasActiveFilters
              ? "Try changing the filters or clearing them."
              : "Database customer orders will appear here after checkout."
          }
        />
      ) : (
        <>
          <div className="md:hidden space-y-3">
            <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/80 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                className="h-5 w-5 accent-primary"
              />
              Select all orders on this page
            </label>

            {orders.map((order) => (
              <OrderMobileCard
                key={order.id}
                order={order}
                selected={selectedSet.has(order.reference)}
                onToggle={() => toggleOrderSelection(order.reference)}
              />
            ))}
          </div>

          <div className="hidden md:block bg-surface/80 border border-border/60 rounded-2xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="w-12 px-4 py-3 text-left font-medium">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select all orders on this page"
                      className="h-4 w-4 accent-primary"
                    />
                  </th>
                  <th className="text-left font-medium px-4 py-3">Reference</th>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Payment</th>
                  <th className="text-left font-medium px-4 py-3">Mode</th>
                  <th className="text-left font-medium px-4 py-3">Total</th>
                  <th className="text-left font-medium px-4 py-3">Date</th>
                  <th className="text-right font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(order.reference)}
                        onChange={() => toggleOrderSelection(order.reference)}
                        aria-label={`Select order ${order.reference}`}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{order.reference}</td>
                    <td className="px-4 py-3">
                      {order.customer.firstName} {order.customer.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.customer.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <SimpleBadge value={formatPaymentStatus(order.paymentStatus)} />
                    </td>
                    <td className="px-4 py-3">
                      <SimpleBadge value={order.customer.deliveryMethod} />
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.totalCents)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: order.reference }}
                        className="text-primary hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end mt-4">
        <PaginationControls
          pagination={pagination}
          isLoading={isLoading}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
        />
      </div>
    </AdminLayout>
  );
}

function OrderMobileCard({
  order,
  selected,
  onToggle,
}: {
  order: ApiAdminOrder;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={`bg-surface/80 border rounded-2xl p-4 shadow-soft ${
      selected ? "border-primary/60 ring-1 ring-primary/20" : "border-border/60"
    }`}>
      <div className="mb-3 flex items-center gap-3 border-b border-border/60 pb-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select order ${order.reference}`}
          className="h-5 w-5 accent-primary"
        />
        <span className="text-xs text-muted-foreground">Select this order</span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{order.reference}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {order.customer.firstName} {order.customer.lastName}
          </p>
        </div>

        <p className="font-display text-base">{formatPrice(order.totalCents)}</p>
      </div>

      <p className="text-sm text-muted-foreground mt-3 break-all">
        {order.customer.email}
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        <StatusBadge status={order.status} />
        <SimpleBadge value={formatPaymentStatus(order.paymentStatus)} />
        <SimpleBadge value={order.customer.deliveryMethod} />
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border/60">
        <span className="text-xs text-muted-foreground">
          {formatDate(order.createdAt)}
        </span>

        <Link
          to="/admin/orders/$id"
          params={{ id: order.reference }}
          className="text-sm text-primary font-medium hover:underline"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full min-w-0 max-w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/60 appearance-none box-border"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0 max-w-full overflow-hidden">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block h-10 w-full min-w-0 max-w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/60 appearance-none box-border overflow-hidden"
        style={{ WebkitAppearance: "none" }}
      />
    </label>
  );
}

function PaginationControls({
  pagination,
  isLoading,
  onPrevious,
  onNext,
}: {
  pagination: AdminOrdersPagination;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={onPrevious}
        disabled={isLoading || pagination.page <= 1}
        className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/60 transition-colors"
      >
        Previous
      </button>

      <span className="text-muted-foreground">
        Page {pagination.page} / {pagination.totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={isLoading || pagination.page >= pagination.totalPages}
        className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/60 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">
      {formatOrderStatus(status)}
    </span>
  );
}

function SimpleBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">
      {value}
    </span>
  );
}

function formatPaymentStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatOrderStatus(status: OrderStatus) {
  if (status === "pending_bank_transfer") {
    return "Awaiting bank transfer";
  }

  return status.replaceAll("_", " ");
}
