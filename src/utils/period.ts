import type { Transaction } from '../types';

export interface MonthRange {
  /** その月の 1 日 0:00:00.000 (ローカル) */
  start: number;
  /** 翌月の 1 日 0:00:00.000 (ローカル、排他的境界) */
  end: number;
  /** 何月か (1-12)。表示用。 */
  month: number;
  /** 西暦。 */
  year: number;
  /** "2026年5月" のような表示用ラベル。 */
  label: string;
  /** "2026-05" のような安定キー。 */
  key: string;
}

export function monthRangeOf(ts: number): MonthRange {
  const d = new Date(ts);
  return monthRangeFromDate(d.getFullYear(), d.getMonth());
}

export function monthRangeFromDate(year: number, month0: number): MonthRange {
  const start = new Date(year, month0, 1, 0, 0, 0, 0).getTime();
  const end = new Date(year, month0 + 1, 1, 0, 0, 0, 0).getTime();
  return {
    start,
    end,
    month: month0 + 1,
    year,
    label: `${year}年${month0 + 1}月`,
    key: `${year}-${String(month0 + 1).padStart(2, '0')}`,
  };
}

/** 直近 N か月分の MonthRange を新しい→古い順で返す。 */
export function recentMonths(count: number, now = Date.now()): MonthRange[] {
  const d = new Date(now);
  const list: MonthRange[] = [];
  for (let i = 0; i < count; i++) {
    list.push(monthRangeFromDate(d.getFullYear(), d.getMonth() - i));
  }
  return list;
}

export function isWithin(range: MonthRange, ts: number): boolean {
  return ts >= range.start && ts < range.end;
}

/** その月の日数。 */
export function daysInMonth(range: MonthRange): number {
  return new Date(range.year, range.month, 0).getDate();
}

/** ある月のうち「今までに過ぎた日数」(その月でなければ全日数)。 */
export function daysElapsedIn(range: MonthRange, now = Date.now()): number {
  if (now < range.start) return 0;
  if (now >= range.end) return daysInMonth(range);
  return new Date(now).getDate();
}

export interface MonthlyAggregation {
  range: MonthRange;
  income: number;
  expense: number;
  net: number;
  good: number;
  bad: number;
  neutral: number;
  /** カテゴリ別の支出 (大きい順)。 */
  topCategories: Array<{ category: string; amount: number }>;
}

export function aggregateMonth(
  transactions: Transaction[],
  range: MonthRange,
): MonthlyAggregation {
  let income = 0;
  let expense = 0;
  let good = 0;
  let bad = 0;
  let neutral = 0;
  const byCat = new Map<string, number>();

  for (const t of transactions) {
    if (!isWithin(range, t.date)) continue;
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expense += t.amount;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
      if (t.satisfaction === 'good') good += t.amount;
      else if (t.satisfaction === 'bad') bad += t.amount;
      else neutral += t.amount;
    }
  }

  const topCategories = Array.from(byCat.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    range,
    income,
    expense,
    net: income - expense,
    good,
    bad,
    neutral,
    topCategories,
  };
}
