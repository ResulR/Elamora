interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionTitle({ eyebrow, title, description, className = "" }: SectionTitleProps) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-display font-medium text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
