import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Plus, Pencil, EyeOff } from "lucide-react";
import { fetchAdminCatalog } from "@/lib/admin-catalog-api";
import { formatPrice } from "@/lib/format";
import type { Product, ProductCategory } from "@/types";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: AdminProductsPage,
});

const categories: { value: ProductCategory; label: string }[] = [
  { value: "bucket", label: "Buckets" },
  { value: "flower", label: "Flowers" },
  { value: "balloon", label: "Balloons" },
  { value: "plush", label: "Plush Toys" },
  { value: "color", label: "Colors" },
];

function AdminProductsPage() {
  const [tab, setTab] = useState<ProductCategory>("bucket");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const catalog = await fetchAdminCatalog();

        if (!cancelled) {
          setProducts(catalog.allProducts);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setLoadError("Could not load products from database.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(
    () => products.filter((product) => product.category === tab),
    [products, tab]
  );

  return (
    <AdminLayout title="Products">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setTab(c.value)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors whitespace-nowrap ${
                tab === c.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-border hover:border-primary/60"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          disabled
          title="Product creation will be added in the next task."
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-muted text-muted-foreground text-sm cursor-not-allowed md:self-end"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="bg-surface/80 border border-border/60 rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Loading products from database...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface/80 border border-border/60 rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No products found for this category.
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {items.map((product) => (
              <ProductMobileCard key={product.dbId ?? product.id} product={product} />
            ))}
          </div>

          <div className="hidden md:block bg-surface/80 border border-border/60 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">DB ID</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.dbId ?? p.id} className="border-t border-border/60">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <ProductMarker product={p} />
                      {p.name}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono">
                      {p.dbId ?? "—"}
                    </td>
                    <td className="px-5 py-3">{formatProductPrice(p)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge active={p.active} />
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <DisabledAction icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" />
                      <DisabledAction icon={<EyeOff className="h-3.5 w-3.5" />} label="Disable" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="mt-4 text-xs italic text-muted-foreground">
        Products are now read from PostgreSQL. Create, edit and disable actions are intentionally disabled until the next admin products task.
      </p>
    </AdminLayout>
  );
}

function ProductMobileCard({ product }: { product: Product }) {
  return (
    <article className="bg-surface/80 border border-border/60 rounded-2xl p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <ProductMarker product={product} />
            <p className="font-semibold truncate">{product.name}</p>
          </div>

          <p className="text-sm text-muted-foreground capitalize mt-2">
            {formatCategory(product.category)}
          </p>
        </div>

        <p className="font-display text-base whitespace-nowrap">
          {formatProductPrice(product)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <StatusBadge active={product.active} />
        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">
          {formatCategory(product.category)}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-border/60">
        <p className="text-xs text-muted-foreground break-all font-mono">
          {product.dbId ?? "No database ID"}
        </p>

        <div className="flex justify-end gap-4 mt-4">
          <DisabledAction icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" />
          <DisabledAction icon={<EyeOff className="h-3.5 w-3.5" />} label="Disable" />
        </div>
      </div>
    </article>
  );
}

function ProductMarker({ product }: { product: Product }) {
  if (product.colorHex) {
    return (
      <span
        className="h-5 w-5 rounded-full border border-border shrink-0"
        style={{ background: product.colorHex }}
      />
    );
  }

  return (
    <span className="h-5 w-5 rounded-full border border-border bg-primary-soft shrink-0" />
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
        active
          ? "bg-success/20 text-success-foreground"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function DisabledAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      disabled
      title={`${label} will be added in a later task.`}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-not-allowed opacity-60"
    >
      {icon} {label}
    </button>
  );
}

function formatProductPrice(product: Product) {
  return product.category === "color" ? "—" : formatPrice(product.price);
}

function formatCategory(category: ProductCategory) {
  if (category === "bucket") return "Bucket";
  if (category === "flower") return "Flower";
  if (category === "balloon") return "Balloon";
  if (category === "plush") return "Plush toy";
  return "Color";
}
