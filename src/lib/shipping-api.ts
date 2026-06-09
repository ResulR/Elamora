export interface ShippingQuote {
  available: boolean;
  shippingCents: number;
  leadTimeDays: number | null;
  zoneName: string | null;
}

interface ShippingQuoteResponse {
  ok: boolean;
  available?: boolean;
  shipping_cents?: number;
  lead_time_days?: number | null;
  zone_name?: string | null;
  error?: string;
}

export async function fetchShippingQuote(params: {
  postalCode: string;
  country: string;
}): Promise<ShippingQuote> {
  const search = new URLSearchParams({
    postalCode: params.postalCode.trim(),
    country: params.country.trim().toUpperCase(),
  });

  const response = await fetch(`/api/shipping/quote?${search.toString()}`, {
    method: "GET",
  });

  const data = (await response.json().catch(() => null)) as ShippingQuoteResponse | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Could not calculate delivery fee");
  }

  return {
    available: Boolean(data.available),
    shippingCents: data.shipping_cents ?? 0,
    leadTimeDays: data.lead_time_days ?? null,
    zoneName: data.zone_name ?? null,
  };
}
