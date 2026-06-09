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
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setTab(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <div className="bg-surface/80 border border-border/60 rounded-2xl overflow-hidden">
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
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Loading products from database...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  No products found for this category.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.dbId ?? p.id} className="border-t border-border/60">
                  <td className="px-5 py-3 flex items-center gap-3">
                    {p.colorHex && (
                      <span
                        className="h-5 w-5 rounded-full border border-border"
                        style={{ background: p.colorHex }}
                      />
                    )}
                    {p.name}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground font-mono">
                    {p.dbId ?? "—"}
                  </td>
                  <td className="px-5 py-3">{formatPrice(p.price)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                        p.active
                          ? "bg-success/20 text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button
                      disabled
                      title="Editing will be added in a later task."
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-not-allowed opacity-60"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      disabled
                      title="Disable/enable will be added in a later task."
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-not-allowed opacity-60"
                    >
                      <EyeOff className="h-3.5 w-3.5" /> Disable
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs italic text-muted-foreground">
        Products are now read from PostgreSQL. Create, edit and disable actions are intentionally disabled until the next admin products task.
      </p>
    </AdminLayout>
  );
}
