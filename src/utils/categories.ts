import type { CategoryKind, CategoryMeta } from '../types';

/**
 * 既定のプリセットカテゴリ。最初に並べる候補としても使う。
 * ユーザーは自由に新しいラベルを入力できるので、これは「マスター」ではない。
 */
export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  {
    label: '外食・カフェ',
    emoji: '🍽️',
    color: '#FF6B9D',
    gradient: 'from-rose-400 to-pink-500',
    hint: 'ランチ・カフェ・ディナー',
    kind: 'dining',
  },
  {
    label: '日用品',
    emoji: '🧺',
    color: '#4FC3A1',
    gradient: 'from-emerald-400 to-teal-500',
    hint: '食材・消耗品・生活費',
    kind: 'daily',
  },
  {
    label: '交際費',
    emoji: '🥂',
    color: '#FFB454',
    gradient: 'from-amber-400 to-orange-500',
    hint: '飲み会・プレゼント',
    kind: 'social',
  },
  {
    label: '自己投資',
    emoji: '📚',
    color: '#5B8DEF',
    gradient: 'from-sky-400 to-indigo-500',
    hint: '書籍・学習・スキル',
    kind: 'self_investment',
  },
  {
    label: '趣味・娯楽',
    emoji: '🎮',
    color: '#A66BFF',
    gradient: 'from-violet-400 to-fuchsia-500',
    hint: 'ゲーム・推し活',
    kind: 'hobby',
  },
  {
    label: '浪費',
    emoji: '💸',
    color: '#FF7676',
    gradient: 'from-red-400 to-rose-500',
    hint: '衝動買い',
    kind: 'impulse',
  },
  {
    label: '住居・光熱費',
    emoji: '🏠',
    color: '#94A3B8',
    gradient: 'from-slate-400 to-slate-500',
    hint: '家賃・電気・ガス',
    kind: 'utility',
  },
  {
    label: '交通',
    emoji: '🚃',
    color: '#60A5FA',
    gradient: 'from-blue-400 to-sky-500',
    hint: '電車・タクシー',
    kind: 'utility',
  },
  {
    label: '健康・美容',
    emoji: '💆',
    color: '#F472B6',
    gradient: 'from-pink-400 to-rose-500',
    hint: '医療・コスメ・ジム',
    kind: 'self_investment',
  },
];

/** 収入のプリセット候補。 */
export const DEFAULT_INCOME_CATEGORIES: CategoryMeta[] = [
  {
    label: '給料',
    emoji: '💰',
    color: '#34D399',
    gradient: 'from-emerald-400 to-green-500',
    hint: 'メインの給与',
    kind: 'income',
  },
  {
    label: '副業',
    emoji: '💼',
    color: '#22D3EE',
    gradient: 'from-cyan-400 to-teal-500',
    hint: 'フリーランス・副業',
    kind: 'income',
  },
  {
    label: 'お小遣い',
    emoji: '🎁',
    color: '#FBBF24',
    gradient: 'from-amber-300 to-yellow-500',
    hint: '臨時収入',
    kind: 'income',
  },
];

const FALLBACK_PALETTE = [
  { color: '#FF6B9D', gradient: 'from-rose-400 to-pink-500' },
  { color: '#4FC3A1', gradient: 'from-emerald-400 to-teal-500' },
  { color: '#FFB454', gradient: 'from-amber-400 to-orange-500' },
  { color: '#5B8DEF', gradient: 'from-sky-400 to-indigo-500' },
  { color: '#A66BFF', gradient: 'from-violet-400 to-fuchsia-500' },
  { color: '#FF7676', gradient: 'from-red-400 to-rose-500' },
  { color: '#60A5FA', gradient: 'from-blue-400 to-cyan-500' },
  { color: '#F472B6', gradient: 'from-pink-400 to-fuchsia-500' },
];

const FALLBACK_EMOJIS = ['📦', '💡', '🔖', '🎯', '🧭', '🔮', '🌿', '✨'];

/** DJB2 — 安定したシード生成用ハッシュ。 */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}

const ALL_DEFAULTS: CategoryMeta[] = [
  ...DEFAULT_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

const DEFAULT_MAP = new Map<string, CategoryMeta>(
  ALL_DEFAULTS.map((c) => [c.label, c]),
);

/** ラベルからメタを取得（未知ならハッシュで安定生成）。 */
export function getCategoryMeta(label: string): CategoryMeta {
  const hit = DEFAULT_MAP.get(label);
  if (hit) return hit;
  const h = hashString(label || 'その他');
  const palette = FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
  const emoji = FALLBACK_EMOJIS[h % FALLBACK_EMOJIS.length];
  return {
    label: label || 'その他',
    emoji,
    color: palette.color,
    gradient: palette.gradient,
    kind: 'other',
  };
}

/** 旧データ移行用 — 旧 CategoryId をラベルに変換。 */
export function migrateLegacyCategoryId(id: string): string {
  switch (id) {
    case 'dining':
      return '外食・カフェ';
    case 'daily':
      return '日用品';
    case 'social':
      return '交際費';
    case 'self_investment':
      return '自己投資';
    case 'hobby':
      return '趣味・娯楽';
    case 'impulse':
      return '浪費';
    default:
      return id;
  }
}

export function kindOf(label: string): CategoryKind {
  return getCategoryMeta(label).kind;
}
