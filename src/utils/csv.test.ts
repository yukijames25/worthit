import { describe, expect, it } from 'vitest';
import { diffImport, parseCsv, transactionsToCsv } from './csv';
import type { Transaction } from '../types';

const tx = (over: Partial<Transaction>): Transaction => ({
  id: over.id ?? Math.random().toString(36),
  type: over.type ?? 'expense',
  amount: over.amount ?? 1000,
  category: over.category ?? '外食',
  memo: over.memo ?? '',
  date: over.date ?? new Date(2026, 4, 15, 12, 0, 0).getTime(),
  satisfaction: over.satisfaction ?? 'neutral',
});

describe('transactionsToCsv', () => {
  it('emits header and rows sorted oldest first', () => {
    const csv = transactionsToCsv([
      tx({ amount: 100, date: new Date(2026, 0, 1).getTime() }),
      tx({ amount: 200, date: new Date(2025, 0, 1).getTime() }),
    ]);
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    expect(lines[0]).toBe('date,type,category,amount,memo,satisfaction');
    expect(lines[1]).toContain('2025-01-01');
    expect(lines[2]).toContain('2026-01-01');
  });

  it('escapes commas and quotes in memo / category', () => {
    const csv = transactionsToCsv([
      tx({ memo: 'hello, "world"' }),
    ]);
    expect(csv).toContain('"hello, ""world"""');
  });
});

describe('parseCsv', () => {
  it('parses the round-trip exported CSV', () => {
    const csv = transactionsToCsv([
      tx({ amount: 1280, category: '外食', memo: 'カフェ' }),
    ]);
    const { rows, malformed } = parseCsv(csv);
    expect(malformed).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: 'expense',
      amount: 1280,
      category: '外食',
      memo: 'カフェ',
    });
  });

  it('flags malformed CSV (missing required column)', () => {
    const broken = 'date,type,category\n2026-01-01,expense,外食';
    const result = parseCsv(broken);
    expect(result.malformed).toBe(true);
  });

  it('reports per-row errors for invalid amounts', () => {
    const csv =
      'date,type,category,amount,memo,satisfaction\n2026-05-01,expense,foo,not-a-number,m,neutral';
    const { rows, errors } = parseCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('diffImport', () => {
  it('detects duplicates by date+type+amount+category+memo', () => {
    const existing = [
      tx({
        amount: 1000,
        category: 'A',
        memo: 'x',
        date: new Date(2026, 4, 15, 12, 0, 0).getTime(),
      }),
    ];
    const toImport = [
      {
        type: 'expense' as const,
        amount: 1000,
        category: 'A',
        memo: 'x',
        date: new Date(2026, 4, 15, 18, 0, 0).getTime(), // same day diff hour
      },
      {
        type: 'expense' as const,
        amount: 999,
        category: 'A',
        memo: 'x',
        date: new Date(2026, 4, 15, 12, 0, 0).getTime(),
      },
    ];
    const { fresh, duplicates } = diffImport(toImport, existing);
    expect(duplicates).toBe(1);
    expect(fresh).toHaveLength(1);
    expect(fresh[0].amount).toBe(999);
  });
});
