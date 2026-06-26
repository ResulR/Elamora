import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Search,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import {
  fetchAdminAuditLog,
  type AdminAuditLogAdminOption,
  type AdminAuditLogEntry,
  type AdminAuditLogPagination,
} from "@/lib/admin-audit-log-api";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/audit-log")({
  head: () => ({
    meta: [{ title: "Audit log — Admin" }],
  }),
  component: AdminAuditLogPage,
});

const pageSize = 20;

const emptyPagination: AdminAuditLogPagination = {
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1,
};

function AdminAuditLogPage() {
  const [adminId, setAdminId] = useState("all");
  const [action, setAction] = useState("all");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [entries, setEntries] = useState<AdminAuditLogEntry[]>([]);
  const [admins, setAdmins] = useState<AdminAuditLogAdminOption[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  const filters = useMemo(
    () => ({
      adminId,
      action,
      q: debouncedQuery,
      dateFrom,
      dateTo,
      page,
      pageSize,
    }),
    [
      action,
      adminId,
      dateFrom,
      dateTo,
      debouncedQuery,
      page,
    ]
  );

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    fetchAdminAuditLog(filters)
      .then((result) => {
        if (cancelled) return;

        setEntries(result.entries);
        setAdmins(result.filters.admins);
        setActions(result.filters.actions);
        setPagination(result.pagination);
        setExpandedIds([]);
      })
      .catch((loadError) => {
        if (cancelled) return;

        console.error(loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the audit log"
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const hasActiveFilters =
    adminId !== "all" ||
    action !== "all" ||
    query.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setAdminId("all");
    setAction("all");
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((entryId) => entryId !== id)
        : [...current, id]
    );
  }

  return (
    <AdminLayout title="Audit log">
      <div className="space-y-5">
        <section className="rounded-2xl border border-border/60 bg-surface/80 p-4 shadow-soft md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
            <label className="block">
              <span className="text-xs text-muted-foreground">
                Search target or action
              </span>

              <div className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    resetPage();
                  }}
                  placeholder="Order reference, target or action"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <SelectField
              label="Administrator"
              value={adminId}
              onChange={(value) => {
                setAdminId(value);
                resetPage();
              }}
              options={[
                { value: "all", label: "All administrators" },
                ...admins.map((admin) => ({
                  value: admin.id,
                  label: admin.email,
                })),
              ]}
            />

            <SelectField
              label="Action"
              value={action}
              onChange={(value) => {
                setAction(value);
                resetPage();
              }}
              options={[
                { value: "all", label: "All actions" },
                ...actions.map((item) => ({
                  value: item,
                  label: formatAction(item),
                })),
              ]}
            />
          </div>

          <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <DateField
              label="From"
              value={dateFrom}
              onChange={(value) => {
                setDateFrom(value);
                resetPage();
              }}
            />

            <DateField
              label="To"
              value={dateTo}
              onChange={(value) => {
                setDateTo(value);
                resetPage();
              }}
            />

            <button
              type="button"
              disabled={!hasActiveFilters}
              onClick={clearFilters}
              className="h-10 rounded-xl border border-border px-4 text-sm transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading audit entries..."
              : `${pagination.total} entr${
                  pagination.total === 1 ? "y" : "ies"
                } found`}
          </p>

          <PaginationControls
            pagination={pagination}
            isLoading={isLoading}
            onPrevious={() =>
              setPage((current) => Math.max(1, current - 1))
            }
            onNext={() =>
              setPage((current) =>
                Math.min(pagination.totalPages, current + 1)
              )
            }
          />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border/60 bg-surface/80 p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">
              Loading audit entries...
            </p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title="Could not load audit log"
            description={error}
          />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title={
              hasActiveFilters
                ? "No audit entries match these filters"
                : "No audit entries yet"
            }
            description={
              hasActiveFilters
                ? "Change or clear the filters to see more entries."
                : "Administrative actions will appear here."
            }
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {entries.map((entry) => (
                <AuditMobileCard
                  key={entry.id}
                  entry={entry}
                  expanded={expandedIds.includes(entry.id)}
                  onToggle={() => toggleExpanded(entry.id)}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-surface/80 shadow-soft md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Administrator
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Target
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {entries.map((entry) => {
                      const expanded = expandedIds.includes(entry.id);

                      return (
                        <AuditDesktopRows
                          key={entry.id}
                          entry={entry}
                          expanded={expanded}
                          onToggle={() => toggleExpanded(entry.id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <PaginationControls
            pagination={pagination}
            isLoading={isLoading}
            onPrevious={() =>
              setPage((current) => Math.max(1, current - 1))
            }
            onNext={() =>
              setPage((current) =>
                Math.min(pagination.totalPages, current + 1)
              )
            }
          />
        </div>
      </div>
    </AdminLayout>
  );
}

function AuditDesktopRows({
  entry,
  expanded,
  onToggle,
}: {
  entry: AdminAuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-t border-border/60">
        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
          {formatDate(entry.createdAt)}
        </td>

        <td className="px-4 py-3">{entry.adminEmail}</td>

        <td className="px-4 py-3">
          <ActionBadge action={entry.action} />
        </td>

        <td className="px-4 py-3">
          <p className="font-medium">
            {formatTargetType(entry.targetType)}
          </p>
          <p className="mt-1 max-w-[260px] truncate font-mono text-xs text-muted-foreground">
            {entry.targetId || "—"}
          </p>
        </td>

        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {expanded ? "Hide" : "View"}
          </button>
        </td>
      </tr>

      {expanded ? (
        <tr className="border-t border-border/40 bg-background/40">
          <td colSpan={5} className="px-4 py-4">
            <PayloadViewer payload={entry.payload} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function AuditMobileCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: AdminAuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-2xl border border-border/60 bg-surface/80 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <ActionBadge action={entry.action} />

        <span className="text-xs text-muted-foreground">
          {formatDate(entry.createdAt)}
        </span>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">
            Administrator
          </dt>
          <dd className="mt-1 break-all">{entry.adminEmail}</dd>
        </div>

        <div>
          <dt className="text-xs text-muted-foreground">Target</dt>
          <dd className="mt-1">
            {formatTargetType(entry.targetType)}
            {entry.targetId ? (
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {entry.targetId}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onToggle}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {expanded ? "Hide details" : "View details"}
      </button>

      {expanded ? (
        <div className="mt-4 border-t border-border/60 pt-4">
          <PayloadViewer payload={entry.payload} />
        </div>
      ) : null}
    </article>
  );
}

function PayloadViewer({ payload }: { payload: unknown }) {
  const hasPayload =
    payload &&
    typeof payload === "object" &&
    Object.keys(payload as Record<string, unknown>).length > 0;

  if (!hasPayload) {
    return (
      <p className="text-sm text-muted-foreground">
        No additional details.
      </p>
    );
  }

  return (
    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-xs leading-6">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span className="inline-flex rounded-full border border-primary/20 bg-primary-soft/30 px-2.5 py-1 text-xs font-medium">
      {formatAction(action)}
    </span>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
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

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs text-muted-foreground">{label}</span>

      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block h-10 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
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
  pagination: AdminAuditLogPagination;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isLoading || pagination.page <= 1}
        className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      <span className="text-muted-foreground">
        Page {pagination.page} / {pagination.totalPages}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={
          isLoading || pagination.page >= pagination.totalPages
        }
        className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function formatAction(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll(".", " · ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTargetType(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
