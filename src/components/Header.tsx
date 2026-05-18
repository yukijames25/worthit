interface Props {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function Header({ title, subtitle, rightSlot }: Props) {
  return (
    <header className="safe-top px-5 pt-3 pb-2 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[1.625rem] font-bold leading-tight tracking-tight text-ink-900 dark:text-night-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[0.8125rem] text-ink-500 dark:text-night-300 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}
