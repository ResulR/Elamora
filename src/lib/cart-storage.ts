/**
 * cart-storage.ts — multi-item cart stored in localStorage.
 *
 * Each CartItem represents one complete creation + its personalization.
 * The checkout aggregates all items into a single backend order.
 */

export type CartItem = {
  id: string;              // unique per item (crypto.randomUUID)
  designId: string;
  creationName: string;
  imageUrl: string;
  basePriceCents: number;
  /** Bridge: bucketId from catalog, used as productId in checkout items[] */
  bucketId: string | null;
  firstName: string;
  message: string;
  customRequests: string;
};

export const CART_KEY = "elamora_cart_items";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asSafePriceCents(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.trunc(value), 1_000_000));
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Partial<CartItem>;

  const id = asString(item.id);
  const designId = asString(item.designId);
  const creationName = asString(item.creationName);
  const bucketId = asNullableString(item.bucketId);

  if (!id || !designId || !creationName || !bucketId) {
    return null;
  }

  return {
    id,
    designId,
    creationName,
    imageUrl: asString(item.imageUrl),
    basePriceCents: asSafePriceCents(item.basePriceCents),
    bucketId,
    firstName: asString(item.firstName),
    message: asString(item.message),
    customRequests: asString(item.customRequests),
  };
}

function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const items: CartItem[] = [];

  for (const rawItem of value) {
    const item = normalizeCartItem(rawItem);
    if (!item || seen.has(item.id)) continue;

    seen.add(item.id);
    items.push(item);
  }

  return items.slice(0, 50);
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function loadCartItems(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return normalizeCartItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/** Notifies all listeners (PublicHeader, GlobalCartDrawer) that the cart changed. */
function dispatchCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("elamora-cart-updated"));
  }
}

/** Opens the GlobalCartDrawer from any component or page. */
export function openGlobalCart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("elamora-open-cart"));
  }
}

export function saveCartItems(items: CartItem[]): void {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(normalizeCartItems(items)));
    dispatchCartUpdated();
  } catch {}
}

export function addCartItem(item: CartItem): CartItem[] {
  const current = loadCartItems();
  const safeItem = normalizeCartItem(item);
  if (!safeItem) return current;

  const updated = [...current, safeItem];
  saveCartItems(updated);
  return loadCartItems();
}

export function removeCartItem(id: string): CartItem[] {
  const current = loadCartItems();
  const updated = current.filter((i) => i.id !== id);
  saveCartItems(updated);
  return updated;
}

export function clearCart(): void {
  try {
    window.localStorage.removeItem(CART_KEY);
    dispatchCartUpdated();
  } catch {}
}

// ── Derived ───────────────────────────────────────────────────────────────────

export function getCartTotalCents(items: CartItem[]): number {
  return normalizeCartItems(items).reduce((sum, item) => sum + item.basePriceCents, 0);
}

/**
 * Builds the aggregated customMessage for the backend order.
 * The backend only supports one customMessage, so we concat all personalizations.
 */
export function buildCartCustomMessage(items: CartItem[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) {
    const item = items[0];
    const parts: string[] = [];
    if (item.message)       parts.push(`Message: ${item.message}`);
    if (item.customRequests) parts.push(`Special request: ${item.customRequests}`);
    return parts.join("\n");
  }

  return items
    .map((item, i) => {
      const lines: string[] = [`${i + 1}. ${item.creationName}`];
      if (item.firstName)     lines.push(`   Name: ${item.firstName}`);
      if (item.message)       lines.push(`   Message: ${item.message}`);
      if (item.customRequests) lines.push(`   Special request: ${item.customRequests}`);
      return lines.join("\n");
    })
    .join("\n\n");
}
