import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfiguratorProvider } from "@/lib/configurator-context";
import { ProductPreview } from "@/components/configurator/ProductPreview";
import { ConfiguratorPanel } from "@/components/configurator/ConfiguratorPanel";
import { OrderSummary } from "@/components/configurator/OrderSummary";
import { StickyCheckoutBar } from "@/components/configurator/StickyCheckoutBar";

export const Route = createFileRoute("/configure")({
  head: () => ({
    meta: [
      { title: "Create your personalized gift — Elamora" },
      { name: "description", content: "Create your personalized gift composition with bubble balloons, flowers, ribbons and a custom message." },
      { property: "og:title", content: "Create your personalized gift — Elamora" },
      { property: "og:description", content: "Create a unique personalized gift composition online." },
    ],
  }),
  component: ConfiguratorPage,
});

function ConfiguratorPage() {
  return (
    <ConfiguratorProvider>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 lg:pb-12">
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Configurator</p>
            <h1 className="font-display text-4xl md:text-5xl text-foreground">
              Create your <span className="italic text-primary">gift bucket</span>
            </h1>
            <p className="mt-3 text-muted-foreground">
              Customize every detail: the bucket, flowers, balloons, colors, name and message.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 lg:sticky lg:top-20 lg:self-start">
              <ProductPreview />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <ConfiguratorPanel />
              <OrderSummary />
            </div>
          </div>
        </div>
        <StickyCheckoutBar />
      </AppLayout>
    </ConfiguratorProvider>
  );
}
