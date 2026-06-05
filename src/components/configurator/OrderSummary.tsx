import { Link } from "@tanstack/react-router";
import { useConfigurator } from "@/lib/configurator-context";
import { formatPrice } from "@/lib/format";

function scrollToConfigureTop() {
  setTimeout(() => {
    document.getElementById("configure-top")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 50);
}

export function OrderSummary() {
  const {
    config,
    selectedDesign,
    mobileStep,
    totalPrice,
    addToCart,
    setDesign,
    setFirstName,
    setMessage,
    setCustomRequests,
    setMobileStep,
  } = useConfigurator();

  const handleAddToCart = () => {
    if (!selectedDesign) return;

    addToCart({
      id: crypto.randomUUID(),
      designId: selectedDesign.id,
      creationName: selectedDesign.name,
      imageUrl: selectedDesign.imageUrl,
      basePriceCents: selectedDesign.basePriceCents,
      bucketId: config.bucketId,
      firstName: config.firstName,
      message: config.message,
      customRequests: config.customRequests,
    });

    setDesign(null);
    setFirstName("");
    setMessage("");
    setCustomRequests("");
    setMobileStep("creation");
    scrollToConfigureTop();
  };

  if (!selectedDesign || mobileStep !== "personalize") {
    return null;
  }

  const details = [
    config.firstName ? `For "${config.firstName}"` : null,
    config.message ? `message included` : null,
    config.customRequests ? `special request included` : null,
  ].filter(Boolean);

  return (
    <div className="bg-card rounded-[32px] border border-primary/15 p-8 md:p-10 shadow-[0_30px_60px_-30px_rgba(176,122,102,0.25)]">
      <div className="flex items-center gap-4 mb-8">
        <span className="h-px flex-1 bg-primary/30" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
          Your composition
        </span>
        <span className="h-px flex-1 bg-primary/30" />
      </div>

      <div className="flex justify-between items-baseline gap-5 mb-2">
        <h3 className="font-display text-2xl leading-tight">
          {selectedDesign.name}
        </h3>

        <span className="font-display text-xl text-primary whitespace-nowrap">
          {formatPrice(totalPrice)}
        </span>
      </div>

      <p className="text-sm italic text-foreground/55 mb-10 leading-relaxed">
        {details.length > 0
          ? details.join(" · ")
          : "Personal details will appear here as you write them."}
      </p>

      <div className="flex items-baseline justify-between border-t border-primary/15 pt-6 mb-8">
        <span className="text-[11px] uppercase tracking-[0.25em] text-foreground/60">
          Subtotal
        </span>

        <span className="font-display text-2xl">
          {formatPrice(totalPrice)}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAddToCart}
          className="flex-1 px-10 py-5 bg-foreground text-background text-[11px] uppercase tracking-[0.25em] font-medium rounded-full hover:bg-primary hover:text-primary-foreground transition-colors duration-500"
        >
          Add to cart
        </button>

        <Link
          to="/"
          className="px-8 py-5 text-center text-[11px] uppercase tracking-[0.2em] text-foreground/60 hover:text-primary transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
