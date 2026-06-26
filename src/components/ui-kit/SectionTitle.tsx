interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  level?: 1 | 2;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  className = "",
  level = 2,
}: SectionTitleProps) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <div className={className}>
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium mb-2">
          {eyebrow}
        </p>
      )}
      <Heading className="text-2xl font-display font-medium text-foreground">
        {title}
      </Heading>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
