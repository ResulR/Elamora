import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfiguratorProvider } from "@/lib/configurator-context";
import { ConfiguratorPanel } from "@/components/configurator/ConfiguratorPanel";
import { StickyCheckoutBar } from "@/components/configurator/StickyCheckoutBar";

export const Route = createFileRoute("/configure")({
  head: () => ({
    meta: [
      { title: "Compose your personalized gift — Elamora" },
      {
        name: "description",
        content:
          "Choose an Elamora creation, add a personal note or special request, then add your gift to cart.",
      },
      { property: "og:title", content: "Compose your personalized gift — Elamora" },
      {
        property: "og:description",
        content: "Create a unique personalized gift composition online.",
      },
    ],
  }),
  component: ConfiguratorPage,
});

function ConfiguratorPage() {
  return (
    <ConfiguratorProvider>
      <AppLayout>
        <main id="configure-top" className="min-h-screen bg-background text-foreground">
          <ConfiguratorPanel />
        </main>

        <StickyCheckoutBar />
      </AppLayout>
    </ConfiguratorProvider>
  );
}
