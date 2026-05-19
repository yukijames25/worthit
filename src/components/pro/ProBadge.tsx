import { Crown } from 'lucide-react';

interface Props {
  /** 'sm' (デフォルト) / 'md' / 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

export function ProBadge({ size = 'sm' }: Props) {
  const cls =
    size === 'lg'
      ? 'text-[0.75rem] py-1 px-2.5 gap-1.5'
      : size === 'md'
        ? 'text-[0.6875rem] py-0.5 px-2 gap-1'
        : 'text-[0.625rem] py-0.5 px-1.5 gap-0.5';
  const icon = size === 'lg' ? 12 : size === 'md' ? 11 : 10;
  return (
    <span
      className={[
        'inline-flex items-center font-bold tracking-wide rounded-full',
        'bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-ios',
        cls,
      ].join(' ')}
    >
      <Crown size={icon} strokeWidth={2.6} />
      PRO
    </span>
  );
}
