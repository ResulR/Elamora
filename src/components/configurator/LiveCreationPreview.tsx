import type { GiftDesign } from "@/lib/design-presets";

export function LiveCreationPreview({
  design,
  firstName,
  message,
}: {
  design: GiftDesign;
  firstName: string;
  message: string;
}) {
  const cleanName = firstName.trim();
  const cleanMessage = message.trim();

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/5] bg-primary-soft/35 rounded-[32px] overflow-hidden shadow-bloom">
        <img
          src={design.imageUrl}
          alt={design.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {cleanName && (
          <div className="absolute inset-x-[18%] bottom-[18%] flex justify-center pointer-events-none">
            <div className="min-h-10 max-w-full px-5 py-2 rounded-full bg-white/94 backdrop-blur-md border border-white shadow-[0_12px_32px_rgba(43,31,39,0.22),0_1px_0_rgba(255,255,255,0.95)_inset] text-center">
              <p className="font-display italic text-xl leading-none text-[#241820] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] truncate">
                {cleanName}
              </p>
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 rounded-full bg-card/75 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-foreground/65">
          Live preview
        </div>
      </div>

      <div className="rounded-[24px] border border-primary/15 bg-card/75 px-5 py-4 shadow-soft">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">
            Gift message
          </p>
          <p className="text-[10px] text-muted-foreground">
            Card preview
          </p>
        </div>

        <p className="font-display italic text-lg leading-relaxed text-foreground/85">
          {cleanMessage || "Your personal message will appear here."}
        </p>
      </div>
    </div>
  );
}
