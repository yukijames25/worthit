import { describe, expect, it } from 'vitest';
import {
  buildSubscriptionAudit,
  estimatedMonthlySavings,
  groupByVerdict,
} from './subscriptionAudit';
import type { Transaction } from '../types';
import type { RecurringRule } from '../hooks/useRecurring';

const NOW = new Date(2026, 4, 15).getTime();
const DAY = 24 * 60 * 60 * 1000;

const rule = (over: Partial<RecurringRule>): RecurringRule => ({
  id: over.id ?? Math.random().toString(36),
  type: 'expense',
  amount: 1490,
  category: 'サブスク',
  memo: 'Netflix',
  dayOfMonth: 5,
  active: true,
  lastRun: null,
  nextDue: NOW,
  ...over,
});

const tx = (over: Partial<Transaction>): Transaction => ({
  id: over.id ?? Math.random().toString(36),
  type: over.type ?? 'expense',
  amount: 1490,
  category: 'サブスク',
  memo: 'Netflix（定期）',
  date: NOW - 10 * DAY,
  satisfaction: 'neutral',
  imagePath: null,
  ...over,
});

describe('buildSubscriptionAudit — matching', () => {
  it('counts only transactions with matching category + amount + 定期 marker', () => {
    const r = rule({ id: 'r1' });
    const txs = [
      tx({ date: NOW - 5 * DAY }), // match
      tx({ amount: 999, date: NOW - 5 * DAY }), // amount mismatch
      tx({ category: '別カテゴリ', date: NOW - 5 * DAY }), // category mismatch
      tx({ memo: 'Netflix', date: NOW - 5 * DAY }), // missing 定期 marker
    ];
    const result = buildSubscriptionAudit([r], txs, { now: NOW });
    expect(result[0].hits).toBe(1);
  });

  it('excludes hits older than lookback window', () => {
    const r = rule({ id: 'r1' });
    const txs = [
      tx({ date: NOW - 5 * DAY }), // recent
      tx({ date: NOW - 200 * DAY }), // too old
    ];
    const result = buildSubscriptionAudit([r], txs, {
      now: NOW,
      lookbackMonths: 3,
    });
    expect(result[0].hits).toBe(1);
  });

  it('ignores inactive rules', () => {
    const r = rule({ id: 'r1', active: false });
    const result = buildSubscriptionAudit([r], [tx({})], { now: NOW });
    expect(result).toHaveLength(0);
  });
});

describe('buildSubscriptionAudit — verdicts', () => {
  it('returns "cancel" when bad ratio >= 50%', () => {
    const r = rule({ id: 'r1' });
    const txs = [
      tx({ date: NOW - 10 * DAY, satisfaction: 'bad' }),
      tx({ date: NOW - 40 * DAY, satisfaction: 'bad' }),
      tx({ date: NOW - 70 * DAY, satisfaction: 'good' }),
    ];
    const [entry] = buildSubscriptionAudit([r], txs, { now: NOW });
    expect(entry.verdict).toBe('cancel');
  });

  it('returns "keep" when good ratio >= 50%', () => {
    const r = rule({ id: 'r1' });
    const txs = [
      tx({ date: NOW - 10 * DAY, satisfaction: 'good' }),
      tx({ date: NOW - 40 * DAY, satisfaction: 'good' }),
      tx({ date: NOW - 70 * DAY, satisfaction: 'bad' }),
    ];
    const [entry] = buildSubscriptionAudit([r], txs, { now: NOW });
    expect(entry.verdict).toBe('keep');
  });

  it('returns "review" when bad ratio is in 30-50%', () => {
    const r = rule({ id: 'r1' });
    const txs = [
      tx({ date: NOW - 10 * DAY, satisfaction: 'bad' }),
      tx({ date: NOW - 40 * DAY, satisfaction: 'good' }),
      tx({ date: NOW - 70 * DAY, satisfaction: 'good' }),
    ];
    const [entry] = buildSubscriptionAudit([r], txs, { now: NOW });
    // bad=1, good=2, badRatio=0.333, goodRatio=0.667. good wins via keep.
    expect(entry.verdict).toBe('keep');
  });

  it('returns "review" when many hits but no ratings (2+ months of silence)', () => {
    const r = rule({ id: 'r1' });
    const txs = [
      tx({ date: NOW - 10 * DAY, satisfaction: 'neutral' }),
      tx({ date: NOW - 40 * DAY, satisfaction: 'neutral' }),
    ];
    const [entry] = buildSubscriptionAudit([r], txs, { now: NOW });
    expect(entry.verdict).toBe('review');
  });

  it('returns "unrated" when zero hits', () => {
    const r = rule({ id: 'r1' });
    const [entry] = buildSubscriptionAudit([r], [], { now: NOW });
    expect(entry.verdict).toBe('unrated');
    expect(entry.hits).toBe(0);
  });
});

describe('groupByVerdict + estimatedMonthlySavings', () => {
  it('groups in canonical order', () => {
    const audit = [
      { verdict: 'keep' as const, monthlyAmount: 100 },
      { verdict: 'cancel' as const, monthlyAmount: 500 },
      { verdict: 'review' as const, monthlyAmount: 300 },
    ] as never;
    const grouped = groupByVerdict(audit);
    expect(grouped.cancel).toHaveLength(1);
    expect(grouped.review).toHaveLength(1);
    expect(grouped.keep).toHaveLength(1);
  });

  it('sums cancel + review for savings estimate', () => {
    const audit = [
      { verdict: 'cancel' as const, monthlyAmount: 1490 },
      { verdict: 'review' as const, monthlyAmount: 980 },
      { verdict: 'keep' as const, monthlyAmount: 2000 },
    ] as never;
    expect(estimatedMonthlySavings(audit)).toBe(1490 + 980);
  });
});
