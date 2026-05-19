import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { useHousehold } from '../context/HouseholdContext';

interface Props {
  onManage: () => void;
}

/**
 * 画面右上のスコープ切替ピル。「個人 / 家族グループ」を切り替える。
 * 家族グループがゼロのときは表示しない (UI を散らかさないため)。
 */
export function HouseholdSwitcher({ onManage }: Props) {
  const { households, currentHousehold, currentHouseholdId, switchScope } =
    useHousehold();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (households.length === 0) return null;

  const label = currentHousehold ? currentHousehold.name : '個人';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'tap-shrink inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border shadow-ios text-[0.6875rem] font-semibold',
          currentHousehold
            ? 'bg-gradient-to-br from-pink-500 to-violet-500 text-white border-transparent'
            : 'bg-white text-ink-700 border-ink-100 dark:bg-night-800 dark:text-night-200 dark:border-night-700 dark:shadow-ios-dark',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Users size={11} />
        <span className="truncate max-w-[80px]">{label}</span>
        <ChevronDown size={11} />
      </button>

      {open && (
        <div
          className={[
            'absolute right-0 mt-1.5 w-52 rounded-2xl overflow-hidden z-30 animate-fade-in',
            'bg-white border border-ink-100 shadow-ios-lg',
            'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
          ].join(' ')}
        >
          <ScopeItem
            label="個人"
            description="自分の取引のみ"
            active={currentHouseholdId === null}
            onClick={() => {
              switchScope(null);
              setOpen(false);
            }}
          />
          {households.map((h) => (
            <ScopeItem
              key={h.id}
              label={h.name}
              description={`${h.memberCount}人${h.isOwner ? ' · オーナー' : ''}`}
              active={currentHouseholdId === h.id}
              onClick={() => {
                switchScope(h.id);
                setOpen(false);
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onManage();
            }}
            className="w-full text-left px-3 py-2.5 text-[0.6875rem] font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 border-t border-ink-100 dark:border-night-700"
          >
            ⚙ 家族グループを管理
          </button>
        </div>
      )}
    </div>
  );
}

function ScopeItem({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2.5 flex items-center justify-between gap-2',
        active
          ? 'bg-brand-50 dark:bg-brand-500/10'
          : 'hover:bg-ink-50 dark:hover:bg-night-700',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="text-[0.8125rem] font-semibold text-ink-900 dark:text-night-100 truncate">
          {label}
        </div>
        <div className="text-[0.625rem] text-ink-500 dark:text-night-400 truncate">
          {description}
        </div>
      </div>
      {active && (
        <span className="size-2 rounded-full bg-brand-500 shrink-0" />
      )}
    </button>
  );
}
