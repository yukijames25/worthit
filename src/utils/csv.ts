import type { Satisfaction, Transaction, TxType } from '../types';
import { fromDateKey, toDateKey } from './format';

/** RFC4180準拠の最小限のエスケープ。 */
function escapeCell(v: string | number): string {
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const COLUMNS = [
  'date',
  'type',
  'category',
  'amount',
  'memo',
  'satisfaction',
] as const;

export function transactionsToCsv(transactions: Transaction[]): string {
  const lines: string[] = [];
  lines.push(COLUMNS.join(','));
  const sorted = [...transactions].sort((a, b) => a.date - b.date);
  for (const t of sorted) {
    lines.push(
      [
        toDateKey(t.date),
        t.type,
        escapeCell(t.category),
        t.amount,
        escapeCell(t.memo ?? ''),
        t.satisfaction,
      ].join(','),
    );
  }
  // Excel 互換のため UTF-8 BOM を先頭に
  return '﻿' + lines.join('\r\n');
}

/** ブラウザ上で CSV をダウンロードさせる。 */
export function downloadCsv(filename: string, content: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================================
// Parser ---------------------------------------------------------------------
// ============================================================================

export interface ImportRow {
  type: TxType;
  amount: number;
  category: string;
  memo: string;
  date: number;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: string[];
  /** ヘッダ無し or 必要列が無い場合は true。 */
  malformed: boolean;
}

/** RFC4180 (簡易) を1行ずつ tokenize。 */
function parseCsvLines(text: string): string[][] {
  // BOM 除去
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const out: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\r') {
        // CR は次の LF とセットで処理されることが多いので skip
      } else if (ch === '\n') {
        row.push(cell);
        out.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    out.push(row);
  }
  return out;
}

const REQUIRED = ['date', 'type', 'category', 'amount'] as const;

export function parseCsv(text: string): ParseResult {
  const lines = parseCsvLines(text).filter((r) => r.some((c) => c.length > 0));
  const errors: string[] = [];
  if (lines.length === 0) {
    return { rows: [], errors: ['CSVが空です'], malformed: true };
  }
  const header = lines[0].map((h) => h.trim().toLowerCase());
  const idx: Record<string, number> = {};
  for (const col of header) idx[col] = header.indexOf(col);
  for (const req of REQUIRED) {
    if (!(req in idx)) {
      return {
        rows: [],
        errors: [`必須列 "${req}" が見つかりません`],
        malformed: true,
      };
    }
  }
  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const r = lines[i];
    const get = (k: string) => (idx[k] !== undefined ? r[idx[k]]?.trim() ?? '' : '');
    const dateStr = get('date');
    const type = get('type') === 'income' ? 'income' : 'expense';
    const amount = Number(get('amount'));
    const category = get('category');
    const memo = idx['memo'] !== undefined ? r[idx['memo']]?.trim() ?? '' : '';
    const sat = get('satisfaction') as Satisfaction;
    if (!dateStr) {
      errors.push(`${i + 1}行目: dateが空`);
      continue;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`${i + 1}行目: amountが不正 (${get('amount')})`);
      continue;
    }
    if (!category) {
      errors.push(`${i + 1}行目: categoryが空`);
      continue;
    }
    const date = fromDateKey(dateStr);
    rows.push({
      type,
      amount: Math.round(amount),
      category,
      memo,
      date,
    });
    // satisfaction is on Transaction, not on input. Caller can decide later.
    void sat;
  }
  return { rows, errors, malformed: false };
}

/** 既存トランザクションから重複検出のキーを生成。 */
function dedupKey(t: { date: number; type: string; amount: number; category: string; memo: string }) {
  return `${toDateKey(t.date)}|${t.type}|${t.amount}|${t.category}|${t.memo}`;
}

/**
 * パース結果と既存記録を照合して、追加候補と重複数を返す。
 */
export function diffImport(
  parsed: ImportRow[],
  existing: Transaction[],
): { fresh: ImportRow[]; duplicates: number } {
  const known = new Set(existing.map(dedupKey));
  const fresh: ImportRow[] = [];
  let duplicates = 0;
  for (const r of parsed) {
    if (known.has(dedupKey(r))) {
      duplicates += 1;
    } else {
      fresh.push(r);
      known.add(dedupKey(r));
    }
  }
  return { fresh, duplicates };
}
