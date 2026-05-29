export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-BE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
