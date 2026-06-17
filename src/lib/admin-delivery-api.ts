export type AdminDeliveryZone = {
  id: string;
  name: string;
  countryCode: string;
  postalPattern: string;
  priceCents: number;
  leadTimeDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminDeliveryBlackoutDate = {
  id: string;
  blackoutDate: string;
  countryCode: string;
  reason: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminDeliveryTimeSlot = {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  countryCode: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminDeliveryPayload = {
  zones: AdminDeliveryZone[];
  blackoutDates: AdminDeliveryBlackoutDate[];
  timeSlots: AdminDeliveryTimeSlot[];
};

export type DeliveryZonePayload = {
  name: string;
  countryCode: string;
  postalPattern: string;
  priceCents: number;
  leadTimeDays: number;
  isActive: boolean;
};

export type DeliveryBlackoutPayload = {
  blackoutDate: string;
  countryCode: string;
  reason: string;
  isActive: boolean;
};

export type DeliveryTimeSlotPayload = {
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  countryCode: string;
  isActive: boolean;
  sortOrder: number;
};

type AdminDeliveryResponse = {
  ok: boolean;
  delivery?: AdminDeliveryPayload;
  zone?: AdminDeliveryZone;
  blackoutDate?: AdminDeliveryBlackoutDate;
  timeSlot?: AdminDeliveryTimeSlot;
  error?: string;
};

async function parseResponse<T>(
  response: Response,
  key: keyof AdminDeliveryResponse,
  fallbackError: string
): Promise<T> {
  const payload = (await response.json().catch(() => null)) as AdminDeliveryResponse | null;

  if (!response.ok || !payload?.ok || !payload[key]) {
    throw new Error(payload?.error || fallbackError);
  }

  return payload[key] as T;
}

export async function fetchAdminDelivery(): Promise<AdminDeliveryPayload> {
  const response = await fetch("/api/admin/delivery", {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  return parseResponse<AdminDeliveryPayload>(response, "delivery", "Could not load delivery settings");
}

export async function createDeliveryZone(payload: DeliveryZonePayload) {
  const response = await fetch("/api/admin/delivery/zones", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminDeliveryZone>(response, "zone", "Could not create delivery zone");
}

export async function updateDeliveryZone(id: string, payload: DeliveryZonePayload) {
  const response = await fetch(`/api/admin/delivery/zones/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminDeliveryZone>(response, "zone", "Could not update delivery zone");
}

export async function deleteDeliveryZone(id: string) {
  const response = await fetch(`/api/admin/delivery/zones/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json().catch(() => null)) as AdminDeliveryResponse | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Could not delete delivery zone");
}

export async function createBlackoutDate(payload: DeliveryBlackoutPayload) {
  const response = await fetch("/api/admin/delivery/blackout-dates", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminDeliveryBlackoutDate>(response, "blackoutDate", "Could not create blackout date");
}

export async function updateBlackoutDate(id: string, payload: DeliveryBlackoutPayload) {
  const response = await fetch(`/api/admin/delivery/blackout-dates/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminDeliveryBlackoutDate>(response, "blackoutDate", "Could not update blackout date");
}

export async function deleteBlackoutDate(id: string) {
  const response = await fetch(`/api/admin/delivery/blackout-dates/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json().catch(() => null)) as AdminDeliveryResponse | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Could not delete blackout date");
}

export async function createTimeSlot(payload: DeliveryTimeSlotPayload) {
  const response = await fetch("/api/admin/delivery/time-slots", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminDeliveryTimeSlot>(response, "timeSlot", "Could not create time slot");
}

export async function updateTimeSlot(id: string, payload: DeliveryTimeSlotPayload) {
  const response = await fetch(`/api/admin/delivery/time-slots/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminDeliveryTimeSlot>(response, "timeSlot", "Could not update time slot");
}

export async function deleteTimeSlot(id: string) {
  const response = await fetch(`/api/admin/delivery/time-slots/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json().catch(() => null)) as AdminDeliveryResponse | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Could not delete time slot");
}
