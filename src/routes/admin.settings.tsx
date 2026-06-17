import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  fetchAdminSettings,
  updateAdminSettings,
  type AdminShopSettings,
  type AdminShopSettingsPayload,
} from "@/lib/admin-settings-api";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettingsPage,
});

const emptyForm: AdminShopSettingsPayload = {
  shopName: "Elamora",
  currency: "EUR",
  bankBeneficiary: "Elamora",
  bankName: "Elamora",
  bankIban: "",
  deliveryFeeCents: 0,
  openingHours: "",
  confirmationMessage: "Thank you for your order!",
  ordersEnabled: true,
};

function AdminSettingsPage() {
  const [form, setForm] = useState<AdminShopSettingsPayload>(emptyForm);
  const [settings, setSettings] = useState<AdminShopSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const nextSettings = await fetchAdminSettings();

        if (cancelled) return;

        setSettings(nextSettings);
        setForm({
          shopName: nextSettings.shopName,
          currency: "EUR",
          bankBeneficiary: nextSettings.bankBeneficiary,
          bankName: nextSettings.bankName,
          bankIban: nextSettings.bankIban,
          deliveryFeeCents: nextSettings.deliveryFeeCents,
          openingHours: nextSettings.openingHours,
          confirmationMessage: nextSettings.confirmationMessage,
          ordersEnabled: nextSettings.ordersEnabled,
        });
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load settings");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <Key extends keyof AdminShopSettingsPayload>(
    key: Key,
    value: AdminShopSettingsPayload[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveError(null);
    setSaveMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveMessage(null);

      const saved = await updateAdminSettings({
        ...form,
        shopName: form.shopName.trim(),
        currency: "EUR",
        bankBeneficiary: form.bankBeneficiary.trim(),
        bankName: form.bankName.trim(),
        bankIban: form.bankIban.trim(),
        openingHours: form.openingHours.trim(),
        confirmationMessage: form.confirmationMessage.trim(),
        deliveryFeeCents: Math.max(0, Math.round(Number(form.deliveryFeeCents) || 0)),
      });

      setSettings(saved);
      setForm({
        shopName: saved.shopName,
        currency: "EUR",
        bankBeneficiary: saved.bankBeneficiary,
        bankName: saved.bankName,
        bankIban: saved.bankIban,
        deliveryFeeCents: saved.deliveryFeeCents,
        openingHours: saved.openingHours,
        confirmationMessage: saved.confirmationMessage,
        ordersEnabled: saved.ordersEnabled,
      });
      setSaveMessage("Settings saved.");
    } catch (error) {
      console.error(error);
      setSaveError(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div className="max-w-4xl space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-primary-soft/25 px-5 py-4">
          <p className="text-sm leading-6 text-muted-foreground">
            These settings are saved in the production database. Bank transfer details are used on the confirmation page and in payment emails.
            Currency is fixed to EUR for all payments.
          </p>
          {settings ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        {loadError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}

        {saveError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {saveMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-border/60 bg-surface/80 p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card title="Shop identity">
                <Field
                  label="Shop name"
                  value={form.shopName}
                  onChange={(value) => updateField("shopName", value)}
                  required
                />
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Currency
                  </label>
                  <div className="mt-1 rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    EUR — fixed for all payments
                  </div>
                </div>
              </Card>

              <Card title="Bank transfer">
                <Field
                  label="Beneficiary"
                  value={form.bankBeneficiary}
                  onChange={(value) => updateField("bankBeneficiary", value)}
                  required
                />
                <Field
                  label="Bank name"
                  value={form.bankName}
                  onChange={(value) => updateField("bankName", value)}
                  required
                />
                <Field
                  label="IBAN"
                  value={form.bankIban}
                  onChange={(value) => updateField("bankIban", value)}
                  placeholder="BE..."
                  required
                />
              </Card>

              <Card title="Delivery">
                <Field
                  label="Default delivery fee (cents)"
                  type="number"
                  min={0}
                  value={String(form.deliveryFeeCents)}
                  onChange={(value) => updateField("deliveryFeeCents", Number(value) || 0)}
                  required
                />
                <Field
                  label="Opening hours"
                  value={form.openingHours}
                  onChange={(value) => updateField("openingHours", value)}
                  placeholder="Mon–Sat 10:00–19:00"
                />
              </Card>

              <Card title="Confirmation message">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  rows={5}
                  value={form.confirmationMessage}
                  onChange={(event) => updateField("confirmationMessage", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </Card>

              <Card title="Orders">
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm text-foreground">Online orders enabled</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      Saved in settings. Checkout enforcement is not connected yet.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.ordersEnabled}
                    onChange={(event) => updateField("ordersEnabled", event.target.checked)}
                    className="h-5 w-5 accent-primary"
                  />
                </label>
              </Card>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface/80 border border-border/60 rounded-2xl p-5 shadow-soft space-y-3">
      <h2 className="font-display text-base">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  maxLength,
  min,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  required?: boolean;
  maxLength?: number;
  min?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        min={min}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
