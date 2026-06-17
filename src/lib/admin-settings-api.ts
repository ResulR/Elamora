export type AdminShopSettings = {
  id: string;
  shopName: string;
  currency: string;
  bankBeneficiary: string;
  bankName: string;
  bankIban: string;
  deliveryFeeCents: number;
  openingHours: string;
  confirmationMessage: string;
  ordersEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminShopSettingsPayload = {
  shopName: string;
  currency: "EUR";
  bankBeneficiary: string;
  bankName: string;
  bankIban: string;
  deliveryFeeCents: number;
  openingHours: string;
  confirmationMessage: string;
  ordersEnabled: boolean;
};

type AdminSettingsResponse = {
  ok: boolean;
  settings?: AdminShopSettings;
  error?: string;
};

export async function fetchAdminSettings(): Promise<AdminShopSettings> {
  const response = await fetch("/api/admin/settings", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as AdminSettingsResponse | null;

  if (!response.ok || !payload?.ok || !payload.settings) {
    throw new Error(payload?.error || "Could not load settings");
  }

  return payload.settings;
}

export async function updateAdminSettings(
  settings: AdminShopSettingsPayload
): Promise<AdminShopSettings> {
  const response = await fetch("/api/admin/settings", {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(settings),
  });

  const payload = (await response.json().catch(() => null)) as AdminSettingsResponse | null;

  if (!response.ok || !payload?.ok || !payload.settings) {
    throw new Error(payload?.error || "Could not save settings");
  }

  return payload.settings;
}
