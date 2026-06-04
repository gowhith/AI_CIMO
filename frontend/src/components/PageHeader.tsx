interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 animate-fade-in-up">
      <div>
        <h1 className="h-page">{title}</h1>
        {subtitle && (
          <p className="text-[15px] text-fg-muted mt-2 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
