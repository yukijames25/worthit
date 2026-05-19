import type { Transaction } from '../types';
import { toDateKey } from './format';

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
  // 次のtickで解放（Safari対策）
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
