import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order details — Admin" }] }),
  component: AdminOrderDetailPage,
});

function AdminOrderDetailPage() {
  const { id } = Route.useParams();

  return (
    <AdminLayout title={`Order #${id}`}>
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Customer information">
          <p className="text-sm text-muted-foreground">TODO: customer details.</p>
        </Card>
        <Card title="Bucket composition">
          <p className="text-sm text-muted-foreground">
            TODO: display the ordered bucket details.
          </p>
        </Card>
        <Card title="Name & message">
          <p className="text-sm text-muted-foreground">TODO: customer name and message.</p>
        </Card>
        <Card title="Internal notes">
          <p className="text-sm text-muted-foreground">TODO: admin notes.</p>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface/80 border border-border/60 rounded-2xl p-5 shadow-soft">
      <h2 className="font-display text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
}
