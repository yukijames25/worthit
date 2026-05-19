import { describe, expect, it } from 'vitest';
import { diagnose, totalExpense, totalIncome } from './scoring';
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

const repeat = (n: number, over: Partial<Transaction>): Transaction[] =>
  Array.from({ length: n }, () => tx(over));

describe('diagnose — edge cases', () => {
  it('returns null with no expenses', () => {
    expect(diagnose([])).toBeNull();
    expect(diagnose([tx({ type: 'income' })])).toBeNull();
  });

  it('returns null when total expense is zero', () => {
    expect(diagnose([tx({ amount: 0 })])).toBeNull();
  });
});

describe('diagnose — all 5 personality types', () => {
  it('🟠 entertainer: heavy social + dining spend', () => {
    const txs = [
      ...repeat(4, { category: '交際費', amount: 8000 }),
      ...repeat(3, { category: '外食・カフェ', amount: 5000 }),
      tx({ category: '日用品', amount: 800 }),
    ];
    const r = diagnose(txs);
    expect(r?.type.id).toBe('entertainer');
    expect(r?.type.name).toContain('エンターテイナー');
    expect(r?.axes.social).toBeGreaterThan(r?.axes.strategic ?? 0);
    expect(r?.axes.social).toBeGreaterThan(r?.axes.passionate ?? 0);
    expect(r?.axes.social).toBeGreaterThan(r?.axes.impulsive ?? 0);
    expect(r?.topCategories[0].category).toBe('交際費');
  });

  it('🔵 strategist: heavy self-investment + daily + utility', () => {
    const txs = [
      ...repeat(5, { category: '自己投資', amount: 6000 }),
      ...repeat(3, { category: '日用品', amount: 3000 }),
      ...repeat(2, { category: '住居・光熱費', amount: 5000 }),
    ];
    const r = diagnose(txs);
    expect(r?.type.id).toBe('strategist');
    expect(r?.type.name).toContain('ストラテジスト');
    expect(r?.axes.strategic).toBeGreaterThan(r?.axes.social ?? 0);
    expect(r?.axes.strategic).toBeGreaterThan(r?.axes.passionate ?? 0);
    expect(r?.axes.strategic).toBeGreaterThan(r?.axes.impulsive ?? 0);
  });

  it('🟣 creator: heavy hobby spend', () => {
    const txs = [
      ...repeat(6, { category: '趣味・娯楽', amount: 7000 }),
      tx({ category: '日用品', amount: 500 }),
    ];
    const r = diagnose(txs);
    expect(r?.type.id).toBe('creator');
    expect(r?.type.name).toContain('クリエイター');
    expect(r?.axes.passionate).toBeGreaterThan(r?.axes.social ?? 0);
    expect(r?.axes.passionate).toBeGreaterThan(r?.axes.strategic ?? 0);
    expect(r?.axes.passionate).toBeGreaterThan(r?.axes.impulsive ?? 0);
    expect(r?.topCategories[0].category).toBe('趣味・娯楽');
  });

  it('🔴 romantic: heavy impulse spend', () => {
    const txs = [
      ...repeat(5, { category: '浪費', amount: 6000 }),
      tx({ category: '日用品', amount: 500 }),
    ];
    const r = diagnose(txs);
    expect(r?.type.id).toBe('romantic');
    expect(r?.type.name).toContain('ロマンチック');
    expect(r?.axes.impulsive).toBeGreaterThan(r?.axes.social ?? 0);
    expect(r?.axes.impulsive).toBeGreaterThan(r?.axes.strategic ?? 0);
    expect(r?.axes.impulsive).toBeGreaterThan(r?.axes.passionate ?? 0);
  });

  it('🌿 sage: balanced distribution across 7+ different kinds', () => {
    // 7 different kinds, equal weight => balanced ≈ 0.95 > 0.9, peakActive ≈ 0.14 < 0.45
    const txs = [
      tx({ category: '外食・カフェ', amount: 3000 }),
      tx({ category: '日用品', amount: 3000 }),
      tx({ category: '交際費', amount: 3000 }),
      tx({ category: '自己投資', amount: 3000 }),
      tx({ category: '趣味・娯楽', amount: 3000 }),
      tx({ category: '浪費', amount: 3000 }),
      tx({ category: '住居・光熱費', amount: 3000 }),
    ];
    const r = diagnose(txs);
    expect(r?.type.id).toBe('sage');
    expect(r?.type.name).toContain('バランス');
    expect(r?.axes.balanced).toBeGreaterThan(0.9);
  });
});

describe('diagnose — output guarantees', () => {
  it('topCategories are sorted by ratio descending and sum to ≤ 1', () => {
    const txs = [
      tx({ category: 'A', amount: 1000 }),
      tx({ category: 'B', amount: 5000 }),
      tx({ category: 'C', amount: 200 }),
      tx({ category: 'D', amount: 2000 }),
    ];
    const r = diagnose(txs)!;
    expect(r.topCategories[0].ratio).toBeGreaterThanOrEqual(r.topCategories[1].ratio);
    expect(r.topCategories[1].ratio).toBeGreaterThanOrEqual(r.topCategories[2].ratio);
    expect(r.topCategories.length).toBeLessThanOrEqual(3);
    const sum = r.topCategories.reduce((s, c) => s + c.ratio, 0);
    expect(sum).toBeLessThanOrEqual(1.001);
  });

  it('confidence is between 20 and 99 inclusive', () => {
    const txs = repeat(3, { category: '趣味・娯楽', amount: 1000 });
    const r = diagnose(txs)!;
    expect(r.confidence).toBeGreaterThanOrEqual(20);
    expect(r.confidence).toBeLessThanOrEqual(99);
  });

  it('confidence increases when more transactions are evaluated', () => {
    const few = repeat(2, { category: '浪費', amount: 3000 });
    const many = repeat(10, {
      category: '浪費',
      amount: 3000,
      satisfaction: 'bad',
    });
    expect(diagnose(many)!.confidence).toBeGreaterThanOrEqual(
      diagnose(few)!.confidence,
    );
  });

  it('summary references the top category label', () => {
    const txs = repeat(4, { category: '趣味・娯楽', amount: 5000 });
    const r = diagnose(txs)!;
    expect(r.summary).toContain('趣味・娯楽');
  });

  it('advice is a non-empty multi-paragraph string', () => {
    const txs = repeat(4, { category: '外食・カフェ', amount: 2000 });
    const r = diagnose(txs)!;
    expect(r.advice.length).toBeGreaterThan(20);
    expect(r.advice.split('\n\n').length).toBeGreaterThanOrEqual(2);
  });
});

describe('diagnose — satisfaction influence', () => {
  it('all good evaluations → high fulfilled axis', () => {
    const txs = repeat(4, {
      category: '趣味・娯楽',
      amount: 1000,
      satisfaction: 'good',
    });
    const r = diagnose(txs)!;
    expect(r.axes.fulfilled).toBeGreaterThan(0.9);
    expect(r.regretRatio).toBeLessThan(0.1);
  });

  it('all bad evaluations → low fulfilled axis', () => {
    const txs = repeat(4, {
      category: '趣味・娯楽',
      amount: 1000,
      satisfaction: 'bad',
    });
    const r = diagnose(txs)!;
    expect(r.axes.fulfilled).toBeLessThan(0.1);
    expect(r.regretRatio).toBeGreaterThan(0.9);
  });

  it('no evaluations → neutral 0.5 fulfilled', () => {
    const txs = repeat(4, {
      category: '趣味・娯楽',
      amount: 1000,
      satisfaction: 'neutral',
    });
    const r = diagnose(txs)!;
    expect(r.axes.fulfilled).toBeCloseTo(0.5, 5);
    expect(r.regretRatio).toBe(0);
  });

  it('regretRatio reflects bad/(good+bad) by amount', () => {
    const txs = [
      tx({ amount: 1000, satisfaction: 'good' }),
      tx({ amount: 3000, satisfaction: 'bad' }),
    ];
    const r = diagnose(txs)!;
    expect(r.regretRatio).toBeCloseTo(0.75, 2);
  });
});

describe('diagnose — custom category kinds', () => {
  it('respects custom kind override', () => {
    const txs = repeat(6, { category: 'マイカテゴリ', amount: 5000 });
    const customs = {
      マイカテゴリ: {
        label: 'マイカテゴリ',
        emoji: '🎯',
        color: '#fff',
        gradient: '',
        kind: 'social' as const,
      },
    };
    const r = diagnose(txs, customs)!;
    expect(r.type.id).toBe('entertainer');
  });

  it('custom kind=hobby drives creator classification', () => {
    const txs = repeat(6, { category: 'モイテゴリ2', amount: 5000 });
    const customs = {
      モイテゴリ2: {
        label: 'モイテゴリ2',
        emoji: '🎮',
        color: '#fff',
        gradient: '',
        kind: 'hobby' as const,
      },
    };
    const r = diagnose(txs, customs)!;
    expect(r.type.id).toBe('creator');
  });
});

describe('totalExpense / totalIncome', () => {
  it('only sums their respective types', () => {
    const txs = [
      tx({ type: 'expense', amount: 100 }),
      tx({ type: 'expense', amount: 200 }),
      tx({ type: 'income', amount: 5000 }),
    ];
    expect(totalExpense(txs)).toBe(300);
    expect(totalIncome(txs)).toBe(5000);
  });
});
