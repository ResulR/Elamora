export interface AdminSession {
  sub: string;
  email: string;
  role: string;
}

interface ApiAdminResponse {
  ok: boolean;
  admin?: AdminSession;
  error?: string;
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null) as ApiAdminResponse | null;

  if (!response.ok || !data?.ok || !data.admin) {
    throw new Error(data?.error || "Login failed");
  }

  return data.admin;
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const response = await fetch("/api/admin/me", {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  const data = await response.json().catch(() => null) as ApiAdminResponse | null;

  if (!response.ok || !data?.ok || !data.admin) {
    return null;
  }

  return data.admin;
}

interface ChangeAdminPasswordResponse {
  ok: boolean;
  requiresLogin?: boolean;
  error?: string;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const response = await fetch("/api/admin/change-password", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  const data = await response
    .json()
    .catch(() => null) as ChangeAdminPasswordResponse | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Could not change password");
  }
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "include",
  });
}
