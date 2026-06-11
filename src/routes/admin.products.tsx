import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  createAdminProduct,
  fetchAdminCatalog,
  type AdminCatalogColorApi,
  type AdminCatalogProductApi,
  type AdminProductCategory,
  type AdminProductPayload,
  updateAdminProduct,
  updateAdminProductActive,
  uploadAdminProductImage,
} from "@/lib/admin-catalog-api";
import { formatPrice } from "@/lib/format";
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Save, X } from "lucide-react";
import type { ProductCategory } from "@/types";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: AdminProductsPage,
});

const productCategories: { value: AdminProductCategory; label: string }[] = [
  { value: "bucket", label: "Buckets" },
  { value: "flower", label: "Flowers" },
  { value: "balloon", label: "Balloons" },
  { value: "plush", label: "Plush Toys" },
];

const tabs: { value: ProductCategory; label: string }[] = [
  ...productCategories,
  { value: "color", label: "Colors" },
];

const emptyForm: ProductFormState = {
  categoryCode: "bucket",
  name: "",
  description: "",
  priceEuros: "0.00",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
};

type ProductFormState = {
  categoryCode: AdminProductCategory;
  name: string;
  description: string;
  priceEuros: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

function AdminProductsPage() {
  const [tab, setTab] = useState<ProductCategory>("bucket");
  const [products, setProducts] = useState<AdminCatalogProductApi[]>([]);
  const [colors, setColors] = useState<AdminCatalogColorApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const isProductTab = tab !== "color";

  async function loadCatalog() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const catalog = await fetchAdminCatalog();
      setProducts(catalog.rawProducts);
      setColors(catalog.rawColors);
    } catch (error) {
      console.error(error);
      setLoadError("Could not load products from database.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, []);

  const visibleProducts = useMemo(
    () => products.filter((product) => product.category === tab),
    [products, tab]
  );

  const sortedColors = useMemo(
    () => [...colors].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [colors]
  );

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingProductId) ?? null,
    [editingProductId, products]
  );

  const resetForm = (categoryCode: AdminProductCategory = isProductTab ? tab : "bucket") => {
    setEditingProductId(null);
    setForm({
      ...emptyForm,
      categoryCode,
    });
    setFormError(null);
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const startCreate = () => {
    resetForm(isProductTab ? tab : "bucket");
  };

  const startEdit = (product: AdminCatalogProductApi) => {
    setEditingProductId(product.id);
    setForm({
      categoryCode: product.category,
      name: product.name,
      description: product.description ?? "",
      priceEuros: centsToEuroInput(product.priceCents),
      imageUrl: product.imageUrl ?? "",
      sortOrder: String(product.sortOrder ?? 0),
      isActive: product.isActive,
    });
    setFormError(null);
    setImageFile(null);
    setImagePreviewUrl(product.imageUrl ?? "");
  };

  const handleImageFile = (file: File | null) => {
    setImageFile(file);

    if (!file) {
      setImagePreviewUrl(form.imageUrl);
      return;
    }

    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const buildPayload = (): AdminProductPayload => {
    const priceCents = eurosToCents(form.priceEuros);
    const sortOrder = Number.parseInt(form.sortOrder || "0", 10);

    if (!form.name.trim()) {
      throw new Error("Product name is required.");
    }

    if (!Number.isFinite(priceCents) || priceCents < 0) {
      throw new Error("Price must be valid.");
    }

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      throw new Error("Sort order must be valid.");
    }

    return {
      categoryCode: form.categoryCode,
      name: form.name.trim(),
      description: form.description.trim(),
      priceCents,
      imageUrl: form.imageUrl.trim(),
      sortOrder,
      isActive: form.isActive,
    };
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setFormError(null);

    try {
      const payload = buildPayload();
      const product = editingProductId
        ? await updateAdminProduct(editingProductId, payload)
        : await createAdminProduct(payload);

      if (imageFile) {
        await uploadAdminProductImage(product.id, imageFile);
      }

      await loadCatalog();
      resetForm(payload.categoryCode);
      setTab(payload.categoryCode);
    } catch (error) {
      console.error(error);
      setFormError(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (product: AdminCatalogProductApi) => {
    setIsSaving(true);
    setFormError(null);

    try {
      await updateAdminProductActive(product.id, !product.isActive);
      await loadCatalog();
    } catch (error) {
      console.error(error);
      setFormError(error instanceof Error ? error.message : "Could not update product status.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="Products">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          {tabs.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setTab(item.value);
                resetForm(item.value === "color" ? "bucket" : item.value);
              }}
              className={`px-4 py-2 rounded-full text-sm border transition-colors whitespace-nowrap ${
                tab === item.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-border hover:border-primary/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isProductTab ? (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium md:self-end"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>
        ) : null}
      </div>

      {loadError ? (
        <AlertMessage tone="error">{loadError}</AlertMessage>
      ) : null}

      {formError ? (
        <AlertMessage tone="error">{formError}</AlertMessage>
      ) : null}

      {isProductTab ? (
        <section className="bg-surface/80 border border-border/60 rounded-2xl p-4 md:p-5 shadow-soft mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl">
                {editingProduct ? "Edit product" : "Create product"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Save a product, upload its image, activate it, then it can appear in the public configurator.
              </p>
            </div>

            {editingProduct ? (
              <button
                type="button"
                onClick={() => resetForm(isProductTab ? tab : "bucket")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" /> Cancel edit
              </button>
            ) : null}
          </div>

          <div className="grid lg:grid-cols-[1fr_260px] gap-5">
            <div className="grid md:grid-cols-2 gap-4">
              <SelectField
                label="Category"
                value={form.categoryCode}
                onChange={(value) => setForm((current) => ({ ...current, categoryCode: value as AdminProductCategory }))}
                options={productCategories}
              />

              <TextField
                label="Name"
                value={form.name}
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                placeholder="Rose"
              />

              <TextField
                label="Price (€)"
                value={form.priceEuros}
                onChange={(value) => setForm((current) => ({ ...current, priceEuros: value }))}
                placeholder="3.00"
              />

              <TextField
                label="Sort order"
                value={form.sortOrder}
                onChange={(value) => setForm((current) => ({ ...current, sortOrder: value }))}
                placeholder="10"
              />

              <label className="md:col-span-2 block">
                <span className="text-xs text-muted-foreground">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                  placeholder="Short product description"
                />
              </label>

              <TextField
                label="Image URL"
                value={form.imageUrl}
                onChange={(value) => {
                  setForm((current) => ({ ...current, imageUrl: value }));
                  if (!imageFile) setImagePreviewUrl(value);
                }}
                placeholder="/products/flowers/rose.png"
              />

              <label className="block">
                <span className="text-xs text-muted-foreground">Upload image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleImageFile(event.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
                />
              </label>

              <label className="md:col-span-2 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  className="h-4 w-4"
                />
                Active product
              </label>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-4">
              <p className="text-sm font-medium mb-3">Preview</p>
              <div className="aspect-square rounded-2xl border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden">
                {imagePreviewUrl || form.imageUrl ? (
                  <img
                    src={imagePreviewUrl || form.imageUrl}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : editingProduct ? "Save changes" : "Create product"}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <AlertMessage tone="info">
          Colors are stored in a separate table. This tab is read-only for now to avoid mixing product CRUD with color CRUD.
        </AlertMessage>
      )}

      {isLoading ? (
        <div className="bg-surface/80 border border-border/60 rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Loading products from database...
        </div>
      ) : tab === "color" ? (
        <ColorTable colors={sortedColors} />
      ) : visibleProducts.length === 0 ? (
        <div className="bg-surface/80 border border-border/60 rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No products found for this category.
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {visibleProducts.map((product) => (
              <ProductMobileCard
                key={product.id}
                product={product}
                isSaving={isSaving}
                onEdit={startEdit}
                onToggleActive={toggleActive}
              />
            ))}
          </div>

          <div className="hidden md:block bg-surface/80 border border-border/60 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Sort</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id} className="border-t border-border/60">
                    <td className="px-5 py-3">
                      <ProductIdentity product={product} />
                    </td>
                    <td className="px-5 py-3">{formatPrice(product.priceCents)}</td>
                    <td className="px-5 py-3">{product.sortOrder}</td>
                    <td className="px-5 py-3">
                      <StatusBadge active={product.isActive} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/60"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => toggleActive(product)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/60 disabled:opacity-50"
                        >
                          {product.isActive ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" /> Disable
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" /> Enable
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function ProductMobileCard({
  product,
  isSaving,
  onEdit,
  onToggleActive,
}: {
  product: AdminCatalogProductApi;
  isSaving: boolean;
  onEdit: (product: AdminCatalogProductApi) => void;
  onToggleActive: (product: AdminCatalogProductApi) => void;
}) {
  return (
    <article className="bg-surface/80 border border-border/60 rounded-2xl p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <ProductIdentity product={product} />

        <p className="font-display text-base whitespace-nowrap">
          {formatPrice(product.priceCents)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <StatusBadge active={product.isActive} />
        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs">
          Sort {product.sortOrder}
        </span>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => onToggleActive(product)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-50"
        >
          {product.isActive ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Disable
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Enable
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function ProductIdentity({ product }: { product: AdminCatalogProductApi }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-12 w-12 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0">
        <p className="font-semibold truncate">{product.name}</p>
        <p className="text-xs text-muted-foreground truncate">{product.id}</p>
      </div>
    </div>
  );
}

function ColorTable({ colors }: { colors: AdminCatalogColorApi[] }) {
  if (colors.length === 0) {
    return (
      <div className="bg-surface/80 border border-border/60 rounded-2xl p-8 text-center text-sm text-muted-foreground">
        No colors found.
      </div>
    );
  }

  return (
    <div className="bg-surface/80 border border-border/60 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left px-5 py-3">Color</th>
            <th className="text-left px-5 py-3">Hex</th>
            <th className="text-left px-5 py-3">Sort</th>
            <th className="text-left px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {colors.map((color) => (
            <tr key={color.id} className="border-t border-border/60">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ background: color.hexCode }}
                  />
                  <span className="font-medium">{color.name}</span>
                </div>
              </td>
              <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{color.hexCode}</td>
              <td className="px-5 py-3">{color.sortOrder}</td>
              <td className="px-5 py-3">
                <StatusBadge active={color.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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

function AlertMessage({ children, tone }: { children: React.ReactNode; tone: "error" | "info" }) {
  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted/30 text-muted-foreground"
      }`}
    >
      {children}
    </div>
  );
}

function centsToEuroInput(cents: number) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function eurosToCents(value: string) {
  const normalized = value.trim().replace(",", ".");
  const euros = Number.parseFloat(normalized || "0");

  if (!Number.isFinite(euros)) {
    return Number.NaN;
  }

  return Math.round(euros * 100);
}
