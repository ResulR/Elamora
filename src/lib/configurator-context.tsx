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

// ─── Config defaults ──────────────────────────────────────────────────────────

const defaultConfig: BucketConfiguration = {
  designId:       null,
  bucketId:       null,
  flowerIds:      [],
  balloonIds:     [],
  colorId:        null,
  firstName:      "",
  message:        "",
  customRequests: "",
};

export type ConfigMode    = "creation" | "custom";
export type MobileStep    = "creation" | "personalize";

// ─── Context interface ────────────────────────────────────────────────────────

interface ConfiguratorContextValue {
  // UI mode — which tab is active
  configMode: ConfigMode;
  setConfigMode: (mode: ConfigMode) => void;
  // Mobile step — "creation" (choose) or "personalize" (form)
  mobileStep: MobileStep;
  setMobileStep: (step: MobileStep) => void;
  // Cart drawer open/closed
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  // Whether the user has added to cart in this session
  cartAdded: boolean;
  setCartAdded: (added: boolean) => void;

  // Configuration state
  config: BucketConfiguration;
  selectedDesign: GiftDesign | undefined;

  // Setters
  setDesign:         (id: string | null) => void;
  setBucket:         (id: string | null) => void;
  setFirstName:      (v: string) => void;
  setMessage:        (v: string) => void;
  setCustomRequests: (v: string) => void;
  // Keep for backwards compatibility with checkout / legacy flow
  toggleFlower:  (id: string) => void;
  toggleBalloon: (id: string) => void;
  setColor:      (id: string | null) => void;
  reset:         () => void;

  // Catalog & pricing
  totalPrice:         number;
  catalog:            CatalogData;
  catalogLoading:     boolean;
  catalogError:       string | null;
  findCatalogProduct: (id: string | null | undefined) => Product | undefined;
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [configMode,  setConfigModeState]  = useState<ConfigMode>("creation");
  const [mobileStep,  setMobileStep]       = useState<MobileStep>("creation");
  const [cartOpen,    setCartOpen]         = useState(false);
  const [cartAdded,   setCartAdded]        = useState(false);
  const [config, setConfig]               = useState<BucketConfiguration>(defaultConfig);
  const [catalog, setCatalog]           = useState<CatalogData>(() => emptyCatalog);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError,   setCatalogError]   = useState<string | null>(null);

  // ── Load catalog ────────────────────────────────────────────────────────────
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

  // ── Auto-resolve bucketId from designId once catalog is ready ────────────
  // Bridge: checkout still needs config.bucketId with a real DB product UUID.
  useEffect(() => {
    if (!config.designId || catalogLoading || catalog.buckets.length === 0) return;
    const design = findDesignById(config.designId);
    if (!design) return;
    const matching = catalog.buckets.find((b) => b.name === design.bridgeBucketName);
    if (matching && config.bucketId !== matching.id) {
      setConfig((c) => ({ ...c, bucketId: matching.id }));
    }
  }, [config.designId, catalog.buckets, catalogLoading]);

  // ── Product lookup ──────────────────────────────────────────────────────────
  const productById = useMemo(
    () => new Map(catalog.allProducts.map((p) => [p.id, p])),
    [catalog.allProducts]
  );
  const findCatalogProduct = (id: string | null | undefined) =>
    id ? productById.get(id) : undefined;

  // ── Total price ─────────────────────────────────────────────────────────────
  const totalPrice = useMemo(() => {
    let t = 0;
    t += findCatalogProduct(config.bucketId)?.price  ?? 0;
    config.flowerIds.forEach( (id) => (t += findCatalogProduct(id)?.price ?? 0));
    config.balloonIds.forEach((id) => (t += findCatalogProduct(id)?.price ?? 0));
    return t;
  }, [config, productById]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedDesign = useMemo(() => findDesignById(config.designId), [config.designId]);

  // ── Context value ────────────────────────────────────────────────────────────
  const value: ConfiguratorContextValue = {
    configMode,
    // setConfigMode only changes the mode + clears design on "custom".
    // It does NOT reset mobileStep — ConfiguratorPanel handles that
    // (so handleModeChange can also trigger scroll before setState settles).
    setConfigMode: (mode) => {
      setConfigModeState(mode);
      if (mode === "custom") {
        setConfig((c) => ({ ...c, designId: null, bucketId: null }));
      }
    },
    mobileStep,
    setMobileStep,
    cartOpen,
    setCartOpen,
    cartAdded,
    setCartAdded,

    config,
    selectedDesign,

    setDesign: (id) =>
      setConfig((c) => ({ ...c, designId: id, bucketId: id === null ? null : c.bucketId })),
    setBucket: (id) =>
      setConfig((c) => ({ ...c, bucketId: id })),
    setFirstName:      (v)  => setConfig((c) => ({ ...c, firstName: v })),
    setMessage:        (v)  => setConfig((c) => ({ ...c, message: v })),
    setCustomRequests: (v)  => setConfig((c) => ({ ...c, customRequests: v })),

    // Legacy / kept for checkout compat
    toggleFlower:  (id) => setConfig((c) => ({
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
    reset:    ()   => { setConfig(defaultConfig); setConfigModeState("creation"); setMobileStep("creation"); setCartOpen(false); setCartAdded(false); },

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
