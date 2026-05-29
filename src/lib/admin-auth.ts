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

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "include",
  });
}
