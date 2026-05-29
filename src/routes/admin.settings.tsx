import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  // TODO: persist settings in the backend.
  return (
    <AdminLayout title="Settings">
      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
        <Card title="Shop identity">
          <Field label="Shop name" defaultValue="Elamora" />
          <Field label="Currency" defaultValue="EUR" />
        </Card>
        <Card title="Delivery">
          <Field label="Delivery fee (€)" defaultValue="0" />
          <Field label="Opening hours" defaultValue="Mon–Sat 10:00–19:00" />
        </Card>
        <Card title="Confirmation message">
          <textarea
            rows={4}
            defaultValue="Thank you for your order!"
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Card>
        <Card title="Orders">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm">Enable online orders</span>
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-primary" />
          </label>
        </Card>
      </div>

      <div className="mt-6">
        <button className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90">
          Save settings (TODO)
        </button>
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

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type="text"
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
