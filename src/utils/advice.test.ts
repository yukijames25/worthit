import { describe, expect, it } from 'vitest';
import {
  buildCategoryInsights,
  buildRecommendations,
  satisfactionTally,
} from './advice';
import type { Transaction } from '../types';

const tx = (over: Partial<Transaction>): Transaction => ({
  id: over.id ?? Math.random().toString(36),
  type: over.type ?? 'expense',
  amount: over.amount ?? 1000,
  category: over.category ?? '外食',
  memo: over.memo ?? '',
  date: over.date ?? Date.now(),
  satisfaction: over.satisfaction ?? 'neutral',
});

describe('buildCategoryInsights', () => {
  it('aggregates per-category good/bad/neutral totals', () => {
    const txs = [
      tx({ category: 'A', amount: 1000, satisfaction: 'good' }),
      tx({ category: 'A', amount: 500, satisfaction: 'bad' }),
      tx({ category: 'A', amount: 200, satisfaction: 'neutral' }),
      tx({ category: 'B', amount: 700, satisfaction: 'bad' }),
    ];
    const ins = buildCategoryInsights(txs);
    const a = ins.find((i) => i.category === 'A')!;
    expect(a.goodAmount).toBe(1000);
    expect(a.badAmount).toBe(500);
    expect(a.neutralAmount).toBe(200);
    expect(a.score).toBeCloseTo(0.333, 2); // (1000-500)/(1000+500)
  });

  it('ignores income transactions', () => {
    const txs = [
      tx({ type: 'income', amount: 10000, category: '給料' }),
      tx({ amount: 100, category: 'A' }),
    ];
    const ins = buildCategoryInsights(txs);
    expect(ins.map((i) => i.category)).toEqual(['A']);
  });
});

describe('buildRecommendations', () => {
  it('returns good-scored categories as recommendations', () => {
    const txs = [
      ...Array.from({ length: 3 }, () =>
        tx({ category: '読書', amount: 1500, satisfaction: 'good' }),
      ),
      tx({ category: '浪費', amount: 2000, satisfaction: 'bad' }),
    ];
    const { recommended, warnings } = buildRecommendations(txs, 3);
    expect(recommended.map((r) => r.category)).toContain('読書');
    expect(warnings.map((r) => r.category)).toContain('浪費');
  });

  it('excludes categories without evaluations', () => {
    const txs = [
      tx({ category: 'unrated', amount: 5000, satisfaction: 'neutral' }),
    ];
    const { recommended, warnings } = buildRecommendations(txs, 3);
    expect(recommended).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});

describe('satisfactionTally', () => {
  it('counts only expense transactions', () => {
    const txs = [
      tx({ satisfaction: 'good' }),
      tx({ satisfaction: 'good' }),
      tx({ satisfaction: 'bad' }),
      tx({ satisfaction: 'neutral' }),
      tx({ type: 'income', satisfaction: 'neutral' }),
    ];
    const t = satisfactionTally(txs);
    expect(t.good).toBe(2);
    expect(t.bad).toBe(1);
    expect(t.neutral).toBe(1);
    expect(t.total).toBe(4);
  });
});
