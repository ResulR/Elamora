import { BucketPreview } from "./BucketPreview";

export function ProductPreview() {
  return (
    <div className="relative rounded-3xl bg-surface/80 border border-border/60 shadow-bloom overflow-hidden">
      <div className="absolute top-4 left-4 z-10 text-xs uppercase tracking-widest text-muted-foreground">
        Prévisualisation
      </div>
      <BucketPreview />
    </div>
  );
}
