import { useConfigurator } from "@/lib/configurator-context";

export function PersonalizationFields() {
  const { config, setFirstName, setMessage } = useConfigurator();
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Prénom (optionnel)
        </label>
        <input
          type="text"
          value={config.firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={30}
          placeholder="Ex. Camille"
          className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Message (optionnel)
        </label>
        <textarea
          value={config.message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Un petit mot tendre…"
          className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    </div>
  );
}
