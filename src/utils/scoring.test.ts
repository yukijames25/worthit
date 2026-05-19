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

describe('diagnose', () => {
  it('returns null with no expenses', () => {
    expect(diagnose([])).toBeNull();
    expect(diagnose([tx({ type: 'income' })])).toBeNull();
  });

  it('classifies heavy-impulse user as romantic', () => {
    const txs = Array.from({ length: 6 }, () =>
      tx({ category: '浪費', amount: 5000 }),
    );
    const r = diagnose(txs);
    expect(r?.type.id).toBe('romantic');
  });

  it('classifies heavy-investment user as strategist', () => {
    const txs = Array.from({ length: 6 }, () =>
      tx({ category: '自己投資', amount: 5000 }),
    );
    const r = diagnose(txs);
    expect(r?.type.id).toBe('strategist');
  });

  it('includes fulfilled axis derived from good/bad', () => {
    const goodTxs = Array.from({ length: 4 }, () =>
      tx({ category: '趣味・娯楽', amount: 1000, satisfaction: 'good' }),
    );
    const r = diagnose(goodTxs);
    expect(r?.axes.fulfilled).toBeGreaterThan(0.9);
    expect(r?.regretRatio).toBeLessThan(0.1);
  });

  it('regretRatio reflects bad-evaluated spend', () => {
    const txs = [
      tx({ amount: 1000, satisfaction: 'good' }),
      tx({ amount: 3000, satisfaction: 'bad' }),
    ];
    const r = diagnose(txs);
    // bad / (good + bad) = 3000 / 4000 = 0.75
    expect(r?.regretRatio).toBeCloseTo(0.75, 2);
  });

  it('respects custom kind from customs map', () => {
    const txs = Array.from({ length: 6 }, () =>
      tx({ category: 'マイカテゴリ', amount: 5000 }),
    );
    const customs = {
      マイカテゴリ: {
        label: 'マイカテゴリ',
        emoji: '🎯',
        color: '#fff',
        gradient: '',
        kind: 'social' as const,
      },
    };
    const r = diagnose(txs, customs);
    // social kind → entertainer expected
    expect(r?.type.id).toBe('entertainer');
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
