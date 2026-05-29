import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BucketConfiguration } from "@/types";
import { findProduct } from "@/data/catalog";

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
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BucketConfiguration>(defaultConfig);

  const totalPrice = useMemo(() => {
    let total = 0;
    total += findProduct(config.bucketId)?.price ?? 0;
    config.flowerIds.forEach((id) => (total += findProduct(id)?.price ?? 0));
    config.balloonIds.forEach((id) => (total += findProduct(id)?.price ?? 0));
    return total;
  }, [config]);

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
