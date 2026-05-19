import type { Transaction } from '../types';
import type { RecurringRule } from '../hooks/useRecurring';

/**
 * サブスク断捨離チェッカーのスコアリング。
 *
 * - 直近 N か月で各 recurring rule が生成した取引を集計し、
 * - 👍 / 👎 / neutral の比率を見て判定する。
 *
 * 取引と rule のマッチングは memo に「（定期）」マーカーが含まれているか + category + amount。
 * (useRecurring.applyDue() が自動挿入する取引には必ずこのマーカーが付く。)
 */

export type AuditVerdict = 'cancel' | 'review' | 'keep' | 'unrated';

export interface AuditEntry {
  ruleId: string;
  /** rule の主要識別: メモがあればメモ、なければカテゴリ。 */
  label: string;
  category: string;
  monthlyAmount: number;
  verdict: AuditVerdict;
  /** N か月で発火した回数。 */
  hits: number;
  good: number;
  bad: number;
  neutral: number;
  /** 累計支出 (この rule に紐づくと判定された取引の合計)。 */
  lifetimeSpent: number;
  /** good 比率 (評価済みの中での)。 0..1。評価がなければ 0。 */
  goodRatio: number;
  /** bad 比率 (評価済みの中での)。 0..1。評価がなければ 0。 */
  badRatio: number;
}

const RECURRING_MARKER = '（定期）';
const DEFAULT_LOOKBACK_MONTHS = 3;

function isFromRecurring(t: Transaction, rule: RecurringRule): boolean {
  if (t.type !== 'expense') return false;
  if (t.category !== rule.category) return false;
  if (t.amount !== rule.amount) return false;
  // memo に '（定期）' を含めば自動生成。ユーザーが編集していてもラベルは残しているはず。
  return t.memo.includes(RECURRING_MARKER);
}

function classify(entry: Omit<AuditEntry, 'verdict'>): AuditVerdict {
  // 直近で 1 件も発火がなければ「未評価」(=最近活動なし)
  if (entry.hits === 0) return 'unrated';

  const rated = entry.good + entry.bad;
  // 1 件も評価がついていない & 古い → 見直し対象
  if (rated === 0) {
    return entry.hits >= 2 ? 'review' : 'unrated';
  }
  if (entry.badRatio >= 0.5) return 'cancel';
  if (entry.goodRatio >= 0.5) return 'keep';
  if (entry.badRatio >= 0.3) return 'review';
  return 'unrated';
}

export interface BuildAuditOptions {
  /** 何か月分遡って評価を見るか。デフォルト 3。 */
  lookbackMonths?: number;
  /** 「今」を表すタイムスタンプ。テスト用。 */
  now?: number;
}

export function buildSubscriptionAudit(
  rules: RecurringRule[],
  transactions: Transaction[],
  opts: BuildAuditOptions = {},
): AuditEntry[] {
  const lookback = opts.lookbackMonths ?? DEFAULT_LOOKBACK_MONTHS;
  const now = opts.now ?? Date.now();
  const cutoff = now - lookback * 30 * 24 * 60 * 60 * 1000;

  return rules
    .filter((r) => r.active && r.type === 'expense')
    .map((rule) => {
      const hits = transactions.filter(
        (t) => t.date >= cutoff && t.date <= now && isFromRecurring(t, rule),
      );
      const good = hits.filter((t) => t.satisfaction === 'good').length;
      const bad = hits.filter((t) => t.satisfaction === 'bad').length;
      const neutral = hits.filter((t) => t.satisfaction === 'neutral').length;
      const lifetimeSpent = hits.reduce((s, t) => s + t.amount, 0);
      const rated = good + bad;
      const goodRatio = rated > 0 ? good / rated : 0;
      const badRatio = rated > 0 ? bad / rated : 0;

      const partial: Omit<AuditEntry, 'verdict'> = {
        ruleId: rule.id,
        label: rule.memo.trim() || rule.category,
        category: rule.category,
        monthlyAmount: rule.amount,
        hits: hits.length,
        good,
        bad,
        neutral,
        lifetimeSpent,
        goodRatio,
        badRatio,
      };
      return { ...partial, verdict: classify(partial) };
    });
}

/** group by verdict in display priority. */
export function groupByVerdict(entries: AuditEntry[]) {
  const groups: Record<AuditVerdict, AuditEntry[]> = {
    cancel: [],
    review: [],
    keep: [],
    unrated: [],
  };
  for (const e of entries) groups[e.verdict].push(e);
  // sort within each group by amount desc
  for (const v of Object.keys(groups) as AuditVerdict[]) {
    groups[v].sort((a, b) => b.monthlyAmount - a.monthlyAmount);
  }
  return groups;
}

/** 月あたりで節約できそうな見込み額 (Pro 限定で表示するサマリー)。 */
export function estimatedMonthlySavings(entries: AuditEntry[]): number {
  return entries
    .filter((e) => e.verdict === 'cancel' || e.verdict === 'review')
    .reduce((s, e) => s + e.monthlyAmount, 0);
}
