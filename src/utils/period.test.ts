import { describe, expect, it } from 'vitest';
import {
  aggregateMonth,
  daysInMonth,
  isWithin,
  monthRangeFromDate,
  monthRangeOf,
  recentMonths,
} from './period';
import type { Transaction } from '../types';

const tx = (over: Partial<Transaction>): Transaction => ({
  id: over.id ?? Math.random().toString(36),
  type: over.type ?? 'expense',
  amount: over.amount ?? 1000,
  category: over.category ?? '外食・カフェ',
  memo: over.memo ?? '',
  date: over.date ?? Date.now(),
  satisfaction: over.satisfaction ?? 'neutral',
});

describe('monthRangeFromDate', () => {
  it('returns inclusive start and exclusive end', () => {
    const r = monthRangeFromDate(2026, 4); // May 2026
    expect(new Date(r.start).getMonth()).toBe(4);
    expect(new Date(r.start).getDate()).toBe(1);
    expect(new Date(r.end).getMonth()).toBe(5);
    expect(new Date(r.end).getDate()).toBe(1);
    expect(r.month).toBe(5);
    expect(r.label).toBe('2026年5月');
  });
});

describe('isWithin', () => {
  it('includes start but excludes end', () => {
    const r = monthRangeFromDate(2026, 0);
    expect(isWithin(r, r.start)).toBe(true);
    expect(isWithin(r, r.end - 1)).toBe(true);
    expect(isWithin(r, r.end)).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('handles 30 / 31 day months', () => {
    expect(daysInMonth(monthRangeFromDate(2026, 1))).toBe(28); // Feb 2026 (not leap)
    expect(daysInMonth(monthRangeFromDate(2024, 1))).toBe(29); // Feb 2024 (leap)
    expect(daysInMonth(monthRangeFromDate(2026, 3))).toBe(30); // April
    expect(daysInMonth(monthRangeFromDate(2026, 4))).toBe(31); // May
  });
});

describe('recentMonths', () => {
  it('returns N months in descending order', () => {
    const now = new Date(2026, 4, 15).getTime();
    const list = recentMonths(3, now);
    expect(list).toHaveLength(3);
    expect(list[0].month).toBe(5);
    expect(list[1].month).toBe(4);
    expect(list[2].month).toBe(3);
  });
});

describe('aggregateMonth', () => {
  const may2026 = monthRangeFromDate(2026, 4);
  const may15 = new Date(2026, 4, 15).getTime();
  const apr15 = new Date(2026, 3, 15).getTime();

  it('sums expenses within month and ignores income for expense bucket', () => {
    const txs = [
      tx({ type: 'expense', amount: 1000, date: may15, satisfaction: 'good' }),
      tx({ type: 'expense', amount: 500, date: may15, satisfaction: 'bad' }),
      tx({ type: 'income', amount: 10000, date: may15 }),
      tx({ type: 'expense', amount: 9999, date: apr15 }),
    ];
    const agg = aggregateMonth(txs, may2026);
    expect(agg.expense).toBe(1500);
    expect(agg.income).toBe(10000);
    expect(agg.net).toBe(8500);
    expect(agg.good).toBe(1000);
    expect(agg.bad).toBe(500);
  });

  it('sorts topCategories by amount descending', () => {
    const txs = [
      tx({ type: 'expense', amount: 100, category: 'A', date: may15 }),
      tx({ type: 'expense', amount: 500, category: 'B', date: may15 }),
      tx({ type: 'expense', amount: 200, category: 'C', date: may15 }),
    ];
    const agg = aggregateMonth(txs, may2026);
    expect(agg.topCategories.map((c) => c.category)).toEqual(['B', 'C', 'A']);
  });
});

describe('monthRangeOf', () => {
  it('finds the range a timestamp belongs to', () => {
    const ts = new Date(2026, 4, 15, 10, 30).getTime();
    const r = monthRangeOf(ts);
    expect(isWithin(r, ts)).toBe(true);
    expect(r.month).toBe(5);
  });
});
