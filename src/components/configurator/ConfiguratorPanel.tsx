import { useEffect, useState } from "react";
import { useConfigurator, type ConfigMode } from "@/lib/configurator-context";
import { CreationSelector } from "./CreationSelector";
import { CustomRequestForm } from "./CustomRequestForm";
import { PersonalizationFields } from "./PersonalizationFields";
import { OrderSummary } from "./OrderSummary";
import { LiveCreationPreview } from "./LiveCreationPreview";

function scrollToConfigureTop() {
  setTimeout(() => {
    document.getElementById("configure-top")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 50);
}

export function ConfiguratorPanel() {
  const {
    configMode,
    setConfigMode,
    mobileStep,
    setMobileStep,
    selectedDesign,
    config,
    catalogError,
  } = useConfigurator();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleModeChange = (mode: ConfigMode) => {
    setConfigMode(mode);
    setMobileStep("creation");
    scrollToConfigureTop();
  };

  if (configMode === "custom") {
    return (
      <section className="max-w-3xl mx-auto px-6 md:px-12 pt-12 pb-32">
        <button
          onClick={() => handleModeChange("creation")}
          className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors mb-10"
        >
          ← Back to creations
        </button>

        <header className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
            Bespoke request
          </span>

          <h1 className="font-display text-4xl md:text-6xl mt-5 leading-[1.05]">
            Tell us your{" "}
            <em className="italic text-primary font-normal">gift idea</em>
          </h1>

          <p className="text-muted-foreground italic mt-4 leading-relaxed">
            Describe the occasion, budget and mood. We will turn it into a clear custom request.
          </p>
        </header>

        <div className="bg-card rounded-[32px] border border-primary/15 p-8 md:p-10 shadow-[0_30px_60px_-30px_rgba(176,122,102,0.25)]">
          <CustomRequestForm />
        </div>
      </section>
    );
  }

  if (mobileStep === "personalize" && selectedDesign) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-10 flex justify-between items-center">
          <button
            onClick={() => {
              setMobileStep("creation");
              scrollToConfigureTop();
            }}
            className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to creations
          </button>

          <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
            Step 02 / 02
          </span>
        </div>

        <section id="configure-panel" className="max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-36 md:pb-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <LiveCreationPreview
                design={selectedDesign}
                firstName={config.firstName}
                message={config.message}
              />
            </div>

            <div>
              <h2 className="font-display text-3xl md:text-4xl leading-tight">
                {selectedDesign.name}
              </h2>

              <span className="block h-px w-10 bg-primary/40 mt-3 mb-3" />

              <p className="font-display text-xl text-primary">
                {new Intl.NumberFormat("en-BE", {
                  style: "currency",
                  currency: "EUR",
                }).format(selectedDesign.basePriceCents / 100)}
              </p>

              <div className="flex items-center gap-4 mt-12 mb-8">
                <span className="h-px flex-1 bg-primary/25" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
                  Personalize
                </span>
                <span className="h-px flex-1 bg-primary/25" />
              </div>

              <PersonalizationFields />
            </div>
          </div>

          <div className="mt-16 lg:mt-20">
            <OrderSummary />
          </div>
        </section>
      </>
    );
  }

  return (
    <section id="configure-panel" className="max-w-7xl mx-auto px-6 md:px-12 pt-12 md:pt-16 pb-32 md:pb-24">
      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="max-w-2xl mx-auto mb-8 flex items-center justify-center px-5 py-4 rounded-2xl border border-primary/20 bg-primary-soft/30 text-sm font-semibold shadow-soft"
        >
          {successMsg}
        </div>
      )}

      {catalogError && (
        <div className="max-w-3xl mx-auto mb-8 rounded-2xl border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          Live catalog could not be loaded. You can still browse our creations, but some live options may be unavailable.
        </div>
      )}

      <header className="text-center mb-16 md:mb-20">
        <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
          Step 01 / 02
        </span>

        <h1 className="font-display text-4xl md:text-6xl mt-5 leading-[1.05]">
          Choose your{" "}
          <em className="italic text-primary font-normal">creation</em>
        </h1>

        <p className="text-muted-foreground italic mt-4">
          A composition for every emotion.
        </p>
      </header>

      <CreationSelector />

      <div className="text-center mt-20 md:mt-24">
        <p className="text-muted-foreground italic text-sm mb-5">
          A precise idea in mind?
        </p>

        <button
          onClick={() => handleModeChange("custom")}
          className="px-9 py-4 border border-primary/40 rounded-full text-[11px] uppercase tracking-[0.25em] hover:bg-primary-soft/40 transition-colors duration-500"
        >
          Request a bespoke creation
        </button>
      </div>
    </section>
  );
}
