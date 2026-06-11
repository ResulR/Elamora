import { useConfigurator } from "@/lib/configurator-context";
import { RibbonPicker } from "./RibbonPicker";

export function PersonalizationFields() {
  const { config, setFirstName, setMessage, setCustomRequests } = useConfigurator();

  return (
    <form className="space-y-7">
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-foreground/70 block mb-2.5">
          Name
        </span>

        <input
          type="text"
          value={config.firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={30}
          placeholder="Louise"
          className="w-full bg-transparent border-b border-primary/20 px-1 py-3 text-base font-display italic placeholder:text-foreground/25 focus:outline-none focus:border-primary transition-colors duration-300"
        />

        <span className="text-[11px] italic text-foreground/40 mt-1.5 block">
          Add the name to include on the gift.
        </span>
      </label>

      <RibbonPicker />

      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-foreground/70 block mb-2.5">
          Message — optional
        </span>

        <textarea
          value={config.message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="Happy birthday, my love."
          className="w-full bg-transparent border-b border-primary/20 px-1 py-3 text-base font-display italic placeholder:text-foreground/25 focus:outline-none focus:border-primary transition-colors duration-300 resize-none"
        />

        <span className="text-[11px] italic text-foreground/40 mt-1.5 block text-right">
          {config.message.length} / 200
        </span>
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-foreground/70 block mb-2.5">
          Special request — optional
        </span>

        <textarea
          value={config.customRequests}
          onChange={(e) => setCustomRequests(e.target.value)}
          maxLength={300}
          rows={4}
          placeholder="Date, age, ribbon color, flowers to change, delivery note…"
          className="w-full bg-transparent border-b border-primary/20 px-1 py-3 text-base font-display italic placeholder:text-foreground/25 focus:outline-none focus:border-primary transition-colors duration-300 resize-none"
        />

        <span className="text-[11px] italic text-foreground/40 mt-1.5 block">
          Include any detail you want us to consider.
        </span>
      </label>
    </form>
  );
}
