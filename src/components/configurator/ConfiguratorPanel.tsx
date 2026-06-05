import { useState, useEffect } from "react";
import { useConfigurator, type ConfigMode } from "@/lib/configurator-context";
import { CreationSelector } from "./CreationSelector";
import { CustomRequestForm } from "./CustomRequestForm";
import { PersonalizationFields } from "./PersonalizationFields";

// ─── Scroll helpers ────────────────────────────────────────────────────────────

/** Scroll to the panel element — used for step navigation (personalize ↔ creation) */
function scrollToPanel() {
  window.requestAnimationFrame(() => {
    document.getElementById("configure-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

/**
 * Scroll to the very top of the /configure page.
 * Uses setTimeout(fn, 50) so React finishes applying state updates before
 * the scroll fires — avoids scrolling to the wrong position.
 */
function scrollToConfigureTop() {
  setTimeout(() => {
    document.getElementById("configure-top")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 50);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all focus:outline-none",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SectionCard({
  index,
  title,
  description,
  optional,
  children,
}: {
  index: number;
  title: string;
  description: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface/70 border border-border/60 rounded-2xl p-5 shadow-soft">
      <header className="flex items-start gap-3 mb-4">
        <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium flex-shrink-0">
          {index}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base leading-tight">{title}</h3>
            {optional && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Optional
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export function ConfiguratorPanel() {
  const {
    configMode, setConfigMode,
    mobileStep, setMobileStep,
    selectedDesign, config,
    addToCart, setDesign, setFirstName, setMessage, setCustomRequests,
  } = useConfigurator();

  const hasCreation = !!selectedDesign;

  // Success message — shown after "Add to cart", auto-hides after 4s
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleAddToCart = () => {
    if (!hasCreation || !selectedDesign) return;

    // Build a CartItem from the current selection + personalization
    addToCart({
      id: crypto.randomUUID(),
      designId:       selectedDesign.id,
      creationName:   selectedDesign.name,
      imageUrl:       selectedDesign.imageUrl,
      basePriceCents: selectedDesign.basePriceCents,
      bucketId:       config.bucketId,
      firstName:      config.firstName,
      message:        config.message,
      customRequests: config.customRequests,
    });

    // Reset the current form so the user can configure another creation
    setDesign(null);
    setFirstName("");
    setMessage("");
    setCustomRequests("");

    setSuccessMsg("Your creation has been added to the cart.");
    setMobileStep("creation");
    scrollToConfigureTop();
  };

  // ── Mode switching ────────────────────────────────────────────────────────────
  const handleModeChange = (mode: ConfigMode) => {
    if (mode === configMode) return;
    setConfigMode(mode);
    setMobileStep("creation");
    scrollToPanel();
  };

  // ── Step navigation ───────────────────────────────────────────────────────────
  const goToPersonalize = () => { setMobileStep("personalize"); scrollToPanel(); };
  const goToCreation    = () => { setMobileStep("creation");    scrollToPanel(); };

  return (
    <div id="configure-panel" className="space-y-5">

      {/* ── Success message — shown after "Add to cart" ── */}
      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-semibold shadow-soft"
          style={{
            background:   "oklch(0.95 0.05 150)",
            borderColor:  "oklch(0.72 0.14 150)",
            color:        "oklch(0.28 0.09 150)",
          }}
        >
          {/* Checkmark icon */}
          <svg
            viewBox="0 0 20 20"
            className="h-5 w-5 flex-shrink-0"
            fill="currentColor"
            style={{ color: "oklch(0.52 0.16 150)" }}
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Mode tabs — hidden in step 2 (personalize) ── */}
      <div className={`${mobileStep === "personalize" ? "hidden" : "flex"} rounded-xl border border-border bg-surface p-1 gap-1`}>
        <TabBtn active={configMode === "creation"} onClick={() => handleModeChange("creation")}>
          Our creations
        </TabBtn>
        <TabBtn active={configMode === "custom"} onClick={() => handleModeChange("custom")}>
          Custom request
        </TabBtn>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          OUR CREATIONS — step-based on mobile AND desktop
          Both steps use block/hidden without lg override:
          desktop and mobile now share the same step logic.
      ════════════════════════════════════════════════════════════════════════ */}
      {configMode === "creation" && (
        <>
          {/* ── Step 1 : Choose a creation ── */}
          <div className={mobileStep === "creation" ? "block" : "hidden"}>
            <SectionCard
              index={1}
              title="Choose a creation"
              description="Select a composition you love — we'll personalise it for you."
            >
              <CreationSelector />
            </SectionCard>

            {/* Continue button — both mobile and desktop */}
            <div className="mt-4">
              <button
                onClick={goToPersonalize}
                disabled={!hasCreation}
                className={`w-full px-4 py-3 rounded-full font-medium text-sm transition-all ${
                  hasCreation
                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-soft"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Continue
              </button>
              {!hasCreation && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Select a creation to continue.
                </p>
              )}
            </div>
          </div>

          {/* ── Step 2 : Personalize ── */}
          <div className={mobileStep === "personalize" ? "block" : "hidden"}>

            {/* Compact creation summary — both mobile and desktop */}
            {selectedDesign && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary-soft/20 border border-primary/15">
                <img
                  src={selectedDesign.imageUrl}
                  alt={selectedDesign.name}
                  className="h-14 w-14 object-cover rounded-xl flex-shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {selectedDesign.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {selectedDesign.includes}
                  </p>
                </div>
              </div>
            )}

            <SectionCard
              index={2}
              title="Personalize"
              description="Add a name, message or special request."
              optional
            >
              <PersonalizationFields />
            </SectionCard>

            {/* Add to cart + back — both mobile and desktop */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleAddToCart}
                disabled={!hasCreation}
                className={`w-full px-4 py-3 rounded-full font-medium text-sm transition-all ${
                  hasCreation
                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-soft"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Add to cart
              </button>
              <button
                onClick={goToCreation}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
              >
                ← Back to creations
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          CUSTOM REQUEST
      ════════════════════════════════════════════════════════════════════════ */}
      {configMode === "custom" && (
        <SectionCard
          index={1}
          title="Describe your request"
          description="Tell us what you have in mind and we'll prepare a unique composition."
        >
          <CustomRequestForm />
        </SectionCard>
      )}
    </div>
  );
}
