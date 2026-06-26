export type AdminAuditLogEntry = {
  id: string;
  adminId: string | null;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  payload: unknown;
  createdAt: string;
};

export type AdminAuditLogAdminOption = {
  id: string;
  email: string;
};

export type AdminAuditLogFilters = {
  adminId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AdminAuditLogPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminAuditLogResult = {
  entries: AdminAuditLogEntry[];
  filters: {
    admins: AdminAuditLogAdminOption[];
    actions: string[];
  };
  pagination: AdminAuditLogPagination;
};

type AdminAuditLogResponse = {
  ok: boolean;
  entries?: AdminAuditLogEntry[];
  filters?: {
    admins: AdminAuditLogAdminOption[];
    actions: string[];
  };
  pagination?: AdminAuditLogPagination;
  error?: string;
};

export async function fetchAdminAuditLog(
  filters: AdminAuditLogFilters = {}
): Promise<AdminAuditLogResult> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    ) {
      return;
    }

    params.set(key, String(value));
  });

  const query = params.toString();

  const response = await fetch(
    query
      ? `/api/admin/audit-log?${query}`
      : "/api/admin/audit-log",
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const payload = (await response
    .json()
    .catch(() => null)) as AdminAuditLogResponse | null;

  if (
    !response.ok ||
    !payload?.ok ||
    !payload.entries ||
    !payload.filters ||
    !payload.pagination
  ) {
    throw new Error(
      payload?.error || "Could not load the audit log"
    );
  }

  return {
    entries: payload.entries,
    filters: payload.filters,
    pagination: payload.pagination,
  };
}
