import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BucketConfiguration, Product } from "@/types";
import { fetchCatalog, emptyCatalog, type CatalogData } from "@/lib/catalog-api";
import { DESIGN_PRESETS, findDesignById, type GiftDesign } from "@/lib/design-presets";
import {
  type CartItem,
  loadCartItems,
  addCartItem,
  removeCartItem as removeCartItemStorage,
  clearCart,
  getCartTotalCents,
} from "@/lib/cart-storage";

// ─── Config defaults ──────────────────────────────────────────────────────────

const defaultConfig: BucketConfiguration = {
  designId:       null,
  bucketId:       null,
  flowerIds:      [],
  balloonIds:     [],
  colorId:        null,
  firstName:      "",
  message:        "",
  ribbonColor:    "Blush",
  customRequests: "",
};

export type ConfigMode = "creation" | "custom";
export type MobileStep = "creation" | "personalize";
export type { CartItem };

// ─── Context interface ────────────────────────────────────────────────────────

interface ConfiguratorContextValue {
  // UI mode
  configMode: ConfigMode;
  setConfigMode: (mode: ConfigMode) => void;
  // Mobile step
  mobileStep: MobileStep;
  setMobileStep: (step: MobileStep) => void;
  // Cart drawer is now global — use openGlobalCart() from cart-storage.ts

  // ── Multi-item cart ──
  cartItems: CartItem[];
  cartCount: number;
  cartTotalCents: number;
  /** Add a fully-built CartItem to the persistent cart. */
  addToCart: (item: CartItem) => void;
  /** Remove a cart item by its id. */
  removeFromCart: (id: string) => void;
  /** Empty the cart completely. */
  clearCartItems: () => void;

  // Current configuration (the item being built right now)
  config: BucketConfiguration;
  selectedDesign: GiftDesign | undefined;

  setDesign:         (id: string | null) => void;
  setBucket:         (id: string | null) => void;
  setFirstName:      (v: string) => void;
  setMessage:        (v: string) => void;
  setRibbonColor:    (v: string) => void;
  setCustomRequests: (v: string) => void;
  // Legacy
  toggleFlower:  (id: string) => void;
  toggleBalloon: (id: string) => void;
  setColor:      (id: string | null) => void;
  reset:         () => void;

  totalPrice:         number;
  catalog:            CatalogData;
  catalogLoading:     boolean;
  catalogError:       string | null;
  findCatalogProduct: (id: string | null | undefined) => Product | undefined;
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [configMode,   setConfigModeState] = useState<ConfigMode>("creation");
  const [mobileStep,   setMobileStep]      = useState<MobileStep>("creation");
  // Cart items — loaded from localStorage on mount
  const [cartItems,    setCartItems]       = useState<CartItem[]>([]);
  const [config,       setConfig]          = useState<BucketConfiguration>(defaultConfig);
  const [catalog,      setCatalog]         = useState<CatalogData>(() => emptyCatalog);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError,   setCatalogError]   = useState<string | null>(null);

  // Load cart from localStorage on mount and keep in sync across tabs.
  useEffect(() => {
    const refreshCart = () => setCartItems(loadCartItems());

    refreshCart();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "elamora_cart_items") refreshCart();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("elamora-cart-updated", refreshCart);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("elamora-cart-updated", refreshCart);
    };
  }, []);

  // Load catalog
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setCatalogLoading(true);
        setCatalogError(null);
        const next = await fetchCatalog();
        if (!cancelled) setCatalog(next);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCatalog(emptyCatalog);
          setCatalogError("Could not load live catalog.");
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  // Auto-resolve bucketId from designId (bridge for checkout)
  useEffect(() => {
    if (!config.designId || catalogLoading || catalog.buckets.length === 0) return;
    const design = findDesignById(config.designId);
    if (!design) return;
    const matching = catalog.buckets.find((b) => b.name === design.bridgeBucketName);
    if (matching && config.bucketId !== matching.id) {
      setConfig((c) => ({ ...c, bucketId: matching.id }));
    }
  }, [config.designId, catalog.buckets, catalogLoading]);

  // Product lookup
  const productById = useMemo(
    () => new Map(catalog.allProducts.map((p) => [p.id, p])),
    [catalog.allProducts]
  );
  const findCatalogProduct = (id: string | null | undefined) =>
    id ? productById.get(id) : undefined;

  // Total price (current in-progress item only)
  const totalPrice = useMemo(() => {
    let t = 0;
    t += findCatalogProduct(config.bucketId)?.price ?? 0;
    config.flowerIds.forEach((id) => (t += findCatalogProduct(id)?.price ?? 0));
    config.balloonIds.forEach((id) => (t += findCatalogProduct(id)?.price ?? 0));
    return t;
  }, [config, productById]);

  const selectedDesign = useMemo(() => findDesignById(config.designId), [config.designId]);

  // Cart derived values
  const cartCount      = cartItems.length;
  const cartTotalCents = useMemo(() => getCartTotalCents(cartItems), [cartItems]);

  // Cart mutations
  const addToCart = (item: CartItem) => {
    const updated = addCartItem(item);
    setCartItems(updated);
  };

  const removeFromCart = (id: string) => {
    const updated = removeCartItemStorage(id);
    setCartItems(updated);
  };

  const clearCartItems = () => {
    clearCart();
    setCartItems([]);
  };

  // ── Context value ─────────────────────────────────────────────────────────────
  const value: ConfiguratorContextValue = {
    configMode,
    setConfigMode: (mode) => {
      setConfigModeState(mode);
      if (mode === "custom") {
        setConfig((c) => ({ ...c, designId: null, bucketId: null }));
      }
    },
    mobileStep,
    setMobileStep,

    cartItems,
    cartCount,
    cartTotalCents,
    addToCart,
    removeFromCart,
    clearCartItems,

    config,
    selectedDesign,

    setDesign: (id) =>
      setConfig((c) => ({ ...c, designId: id, bucketId: id === null ? null : c.bucketId })),
    setBucket: (id) => setConfig((c) => ({ ...c, bucketId: id })),
    setFirstName:      (v) => setConfig((c) => ({ ...c, firstName: v })),
    setMessage:        (v) => setConfig((c) => ({ ...c, message: v })),
    setRibbonColor:    (v) => setConfig((c) => ({ ...c, ribbonColor: v })),
    setCustomRequests: (v) => setConfig((c) => ({ ...c, customRequests: v })),

    toggleFlower: (id) => setConfig((c) => ({
      ...c,
      flowerIds: c.flowerIds.includes(id)
        ? c.flowerIds.filter((x) => x !== id)
        : [...c.flowerIds, id],
    })),
    toggleBalloon: (id) => setConfig((c) => ({
      ...c,
      balloonIds: c.balloonIds.includes(id)
        ? c.balloonIds.filter((x) => x !== id)
        : [...c.balloonIds, id],
    })),
    setColor: (id) => setConfig((c) => ({ ...c, colorId: id })),

    reset: () => {
      setConfig(defaultConfig);
      setConfigModeState("creation");
      setMobileStep("creation");
    },

    totalPrice,
    catalog,
    catalogLoading,
    catalogError,
    findCatalogProduct,
  };

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
}

export function useConfigurator() {
  const ctx = useContext(ConfiguratorContext);
  if (!ctx) throw new Error("useConfigurator must be used inside ConfiguratorProvider");
  return ctx;
}

export { DESIGN_PRESETS, findDesignById };
export type { GiftDesign };
