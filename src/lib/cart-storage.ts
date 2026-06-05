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

const CART_KEY = "elamora_cart_items";

// ── Read ──────────────────────────────────────────────────────────────────────

export function loadCartItems(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
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
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    dispatchCartUpdated();
  } catch {}
}

export function addCartItem(item: CartItem): CartItem[] {
  const current = loadCartItems();
  const updated = [...current, item];
  saveCartItems(updated);   // saveCartItems already dispatches
  return updated;
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
  return items.reduce((sum, item) => sum + item.basePriceCents, 0);
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
