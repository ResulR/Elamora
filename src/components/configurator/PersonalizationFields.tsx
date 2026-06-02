import { useConfigurator } from "@/lib/configurator-context";

export function PersonalizationFields() {
  const { config, setFirstName, setMessage, setCustomRequests } = useConfigurator();
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Name — optional
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
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Special request — optional
        </label>
        <textarea
          value={config.customRequests}
          onChange={(e) => setCustomRequests(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="E.g. Replace roses with peonies, add a small teddy bear…"
          className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    </div>
  );
}
