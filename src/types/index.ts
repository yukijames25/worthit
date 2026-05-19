// Core ledger types ----------------------------------------------------------

export type TxType = 'income' | 'expense';

/** ユーザーの後追い満足度評価。 */
export type Satisfaction = 'good' | 'bad' | 'neutral';

/** 1件の家計簿エントリ（収入 or 支出）。 */
export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  /** 自由記述のカテゴリラベル。 */
  category: string;
  memo: string;
  /** Unix epoch (ms)。 */
  date: number;
  /** 収入の場合は常に 'neutral'。 */
  satisfaction: Satisfaction;
  /** Supabase Storage の receipts bucket 上のパス。null/undefined なら画像なし。 */
  imagePath?: string | null;
}

// Category metadata ----------------------------------------------------------

/**
 * カテゴリを 5 つの「軸」に分類する内部フラグ。
 * 自由入力されたカスタムカテゴリは 'other' になる。
 */
export type CategoryKind =
  | 'dining'
  | 'daily'
  | 'social'
  | 'self_investment'
  | 'hobby'
  | 'impulse'
  | 'utility'
  | 'income'
  | 'other';

export interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  hint?: string;
  kind: CategoryKind;
}

// Personality system ---------------------------------------------------------

export type PersonalityId =
  | 'entertainer'
  | 'strategist'
  | 'creator'
  | 'romantic'
  | 'sage';

export interface PersonalityType {
  id: PersonalityId;
  name: string;
  tagline: string;
  emoji: string;
  heroGradient: string;
  accent: string;
  description: string;
  strengths: string[];
  blindspots: string[];
  signatureKinds: CategoryKind[];
}

export interface PersonalityResult {
  type: PersonalityType;
  /** 0–100 — how clear is the dominant signal. */
  confidence: number;
  /** Top categories by spend share (expense only). */
  topCategories: Array<{ category: string; ratio: number }>;
  axes: {
    social: number;
    strategic: number;
    passionate: number;
    impulsive: number;
    balanced: number;
    /** good 評価率 (満足度) — 0..1。 */
    fulfilled: number;
  };
  advice: string;
  summary: string;
  /** bad ÷ (good + bad)。評価がついた支出のなかでの後悔率。 */
  regretRatio: number;
}

// Advice engine --------------------------------------------------------------

export interface CategoryInsight {
  category: string;
  total: number;
  count: number;
  goodAmount: number;
  badAmount: number;
  neutralAmount: number;
  /** -1..1。+ = 満足、− = 後悔。 */
  score: number;
}

export interface Recommendation {
  category: string;
  amount: number;
  /** -1..1。+ = 推奨、− = 警告。 */
  score: number;
  goodCount: number;
  badCount: number;
}

// Settings -------------------------------------------------------------------

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontScale = 'sm' | 'md' | 'lg';
export type Locale = 'ja' | 'en';

// Navigation -----------------------------------------------------------------

export type ScreenId = 'statement' | 'advice' | 'result' | 'settings';
