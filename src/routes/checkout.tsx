import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SectionTitle } from "@/components/ui-kit/SectionTitle";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Complete your order — Elamora" },
      { name: "description", content: "Review your personalized gift bucket and add your delivery details." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <SectionTitle
          eyebrow="Step 2 / 3"
          title="Complete your order"
          description="Your information stays private and secure."
          className="mb-8"
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
              <h2 className="font-display text-xl mb-4">Your details</h2>
              <form className="grid sm:grid-cols-2 gap-4">
                <Field label="First name" placeholder="Camille" />
                <Field label="Email" type="email" placeholder="you@example.com" />
                <Field label="Phone" type="tel" placeholder="+32 470 00 00 00" />
                <Field label="Address optional" placeholder="Street, city, postal code" />
              </form>
            </section>

            <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
              <h2 className="font-display text-xl mb-4">Delivery</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                  <input type="radio" name="delivery" className="mr-2" defaultChecked />
                  <span className="font-medium">Store pickup</span>
                  <p className="text-xs text-muted-foreground mt-1">Free — TODO: time slots</p>
                </label>
                <label className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                  <input type="radio" name="delivery" className="mr-2" />
                  <span className="font-medium">Delivery</span>
                  <p className="text-xs text-muted-foreground mt-1">TODO: pricing & zones</p>
                </label>
              </div>
            </section>
          </div>

          <aside className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft h-fit">
            <h2 className="font-display text-lg mb-3">Your composition</h2>
            <p className="text-sm text-muted-foreground">
              The personalization summary will appear here.
              <br />
              <span className="text-xs italic">TODO: connect to persisted configurator state.</span>
            </p>
            <button
              disabled
              title="TODO: connect payment"
              className="mt-6 w-full px-4 py-3 rounded-full bg-muted text-muted-foreground cursor-not-allowed text-sm font-medium"
            >
              Confirm order (TODO)
            </button>
            <Link to="/" className="block mt-3 text-center text-xs text-muted-foreground hover:text-foreground">
              ← Back to configurator
            </Link>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
