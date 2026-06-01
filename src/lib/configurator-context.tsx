import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BucketConfiguration, Product } from "@/types";
import {
  fetchCatalog,
  getFallbackCatalog,
  type CatalogData,
} from "@/lib/catalog-api";

const defaultConfig: BucketConfiguration = {
  bucketId: null,
  flowerIds: [],
  balloonIds: [],
  colorId: null,
  firstName: "",
  message: "",
};

interface ConfiguratorContextValue {
  config: BucketConfiguration;
  setBucket: (id: string | null) => void;
  toggleFlower: (id: string) => void;
  toggleBalloon: (id: string) => void;
  setColor: (id: string | null) => void;
  setFirstName: (v: string) => void;
  setMessage: (v: string) => void;
  reset: () => void;
  totalPrice: number;
  catalog: CatalogData;
  catalogLoading: boolean;
  catalogError: string | null;
  findCatalogProduct: (id: string | null | undefined) => Product | undefined;
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BucketConfiguration>(defaultConfig);
  const [catalog, setCatalog] = useState<CatalogData>(() => getFallbackCatalog());
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        setCatalogLoading(true);
        setCatalogError(null);

        const nextCatalog = await fetchCatalog();

        if (!cancelled) {
          setCatalog(nextCatalog);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setCatalog(getFallbackCatalog());
          setCatalogError("Could not load live catalog. Showing fallback catalog.");
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const productById = useMemo(() => {
    return new Map(catalog.allProducts.map((product) => [product.id, product]));
  }, [catalog.allProducts]);

  const findCatalogProduct = (id: string | null | undefined) => {
    if (!id) return undefined;
    return productById.get(id);
  };

  const totalPrice = useMemo(() => {
    let total = 0;
    total += findCatalogProduct(config.bucketId)?.price ?? 0;
    config.flowerIds.forEach((id) => (total += findCatalogProduct(id)?.price ?? 0));
    config.balloonIds.forEach((id) => (total += findCatalogProduct(id)?.price ?? 0));
    return total;
  }, [config, productById]);

  const value: ConfiguratorContextValue = {
    config,
    setBucket: (id) => setConfig((c) => ({ ...c, bucketId: id })),
    toggleFlower: (id) =>
      setConfig((c) => ({
        ...c,
        flowerIds: c.flowerIds.includes(id)
          ? c.flowerIds.filter((x) => x !== id)
          : [...c.flowerIds, id],
      })),
    toggleBalloon: (id) =>
      setConfig((c) => ({
        ...c,
        balloonIds: c.balloonIds.includes(id)
          ? c.balloonIds.filter((x) => x !== id)
          : [...c.balloonIds, id],
      })),
    setColor: (id) => setConfig((c) => ({ ...c, colorId: id })),
    setFirstName: (v) => setConfig((c) => ({ ...c, firstName: v })),
    setMessage: (v) => setConfig((c) => ({ ...c, message: v })),
    reset: () => setConfig(defaultConfig),
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
