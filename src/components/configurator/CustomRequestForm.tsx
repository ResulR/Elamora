import { useConfigurator } from "@/lib/configurator-context";

/**
 * Free-form custom gift request.
 * Does NOT go through the regular checkout — this is a quote/contact flow.
 */
export function CustomRequestForm() {
  const { config, setCustomRequests, setFirstName, setMessage } = useConfigurator();

  return (
    <div className="space-y-4">
      {/* Main description */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Describe your ideal gift
        </label>
        <textarea
          value={config.customRequests}
          onChange={(e) => setCustomRequests(e.target.value)}
          maxLength={600}
          rows={5}
          placeholder="E.g. A pink baby girl gift box with an elephant plush, roses, and a bubble balloon with her name. Budget around €60–70."
          className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="mt-1 text-[10px] text-muted-foreground italic">
          Include the occasion, colours, elements you want, budget range and any important details.
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Name to include — optional
        </label>
        <input
          type="text"
          value={config.firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={30}
          placeholder="E.g. Emma"
          className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Message */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Gift message — optional
        </label>
        <textarea
          value={config.message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="E.g. Happy birthday! Wishing you all the best."
          className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    </div>
  );
}
