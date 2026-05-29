import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ShoppingBag, Clock, TrendingUp, Package } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  component: AdminDashboard,
});

const stats = [
  { label: "Today's orders", value: "—", icon: ShoppingBag },
  { label: "Pending orders", value: "—", icon: Clock },
  { label: "Revenue", value: "—", icon: TrendingUp },
  { label: "Active products", value: "—", icon: Package },
];

function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-surface/80 border border-border/60 rounded-2xl p-5 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 italic">TODO: real data</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
        <h2 className="font-display text-lg mb-2">Recent activity</h2>
        <p className="text-sm text-muted-foreground">
          No data yet. The latest orders will appear here.
        </p>
      </div>
    </AdminLayout>
  );
}
