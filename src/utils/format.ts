const yenFormatter = new Intl.NumberFormat('ja-JP');

export function formatYen(amount: number): string {
  return `¥${yenFormatter.format(Math.round(amount))}`;
}

export function formatYenCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `¥${(amount / 10_000).toFixed(0)}万`;
  }
  if (amount >= 10_000) {
    return `¥${(amount / 10_000).toFixed(1)}万`;
  }
  return formatYen(amount);
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'たった今';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}日前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const WEEK_KANJI = ['日', '月', '火', '水', '木', '金', '土'];

/** "2024年5月18日 (土)" のような日付ヘッダ。 */
export function formatDateHeader(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return `今日 (${WEEK_KANJI[d.getDay()]})`;
  if (sameDay(d, yesterday)) return `昨日 (${WEEK_KANJI[d.getDay()]})`;

  const sameYear = d.getFullYear() === today.getFullYear();
  return sameYear
    ? `${d.getMonth() + 1}月${d.getDate()}日 (${WEEK_KANJI[d.getDay()]})`
    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${WEEK_KANJI[d.getDay()]})`;
}

/** YYYY-MM-DD のキー（date input にも使う）。 */
export function toDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** date input の value から timestamp に変換（その日の正午を採用してタイムゾーン崩れを防止）。 */
export function fromDateKey(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return Date.now();
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
}

export function formatShortTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
