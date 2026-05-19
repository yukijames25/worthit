import type {
  CategoryKind,
  CategoryMeta,
  PersonalityId,
  PersonalityResult,
  Transaction,
} from '../types';
import { kindOf } from './categories';
import { PERSONALITIES } from './personalities';

interface Axes {
  social: number;
  strategic: number;
  passionate: number;
  impulsive: number;
  balanced: number;
  fulfilled: number;
}

const TRACKED_KINDS: CategoryKind[] = [
  'dining',
  'daily',
  'social',
  'self_investment',
  'hobby',
  'impulse',
  'utility',
  'other',
];

function expensesOf(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.type === 'expense');
}

function totalAmount(transactions: Transaction[]): number {
  return transactions.reduce((s, t) => s + t.amount, 0);
}

/**
 * カテゴリ kind ごとの支出比率と good/bad シグナルから 5 軸スコアを算出する。
 */
function computeAxes(
  kindRatios: Record<CategoryKind, number>,
  goodRatio: number,
  badRatio: number,
): Axes {
  const r = (k: CategoryKind) => kindRatios[k] ?? 0;

  const social = r('social') * 0.6 + r('dining') * 0.4;
  const strategic = r('self_investment') * 0.55 + r('daily') * 0.3 + r('utility') * 0.15;
  const passionate = r('hobby') * 0.85 + r('self_investment') * 0.15;
  const impulsive = r('impulse') * 0.8 + r('hobby') * 0.1 + r('other') * 0.1;

  const positive = TRACKED_KINDS.map(r).filter((x) => x > 0);
  const entropy = -positive.reduce((s, x) => s + x * Math.log(x), 0);
  const maxEntropy = Math.log(Math.max(2, TRACKED_KINDS.length));
  const balanced = maxEntropy > 0 ? entropy / maxEntropy : 0;

  // 満足度: good ÷ (good + bad)。評価ゼロなら 0.5（中立）。
  const fulfilled =
    goodRatio + badRatio > 0 ? goodRatio / (goodRatio + badRatio) : 0.5;

  return { social, strategic, passionate, impulsive, balanced, fulfilled };
}

function pickPersonality(axes: Axes): PersonalityId {
  const peakActive = Math.max(
    axes.social,
    axes.strategic,
    axes.passionate,
    axes.impulsive,
  );
  if (axes.balanced > 0.9 && peakActive < 0.45) return 'sage';

  const ranked: Array<[PersonalityId, number]> = [
    ['entertainer', axes.social],
    ['strategist', axes.strategic],
    ['creator', axes.passionate],
    ['romantic', axes.impulsive],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  return ranked[0][0];
}

function pct(r: number): number {
  return Math.round(r * 1000) / 10;
}

function buildSummary(
  personalityId: PersonalityId,
  top: Array<{ category: string; ratio: number }>,
  fulfilled: number,
): string {
  const topCat = top[0];
  if (!topCat) return 'まだ十分なデータがありません。';
  const moodTag =
    fulfilled >= 0.7
      ? '満足度の高い'
      : fulfilled <= 0.35
        ? '少し後悔気味の'
        : '';

  const ratio = pct(topCat.ratio);
  switch (personalityId) {
    case 'entertainer':
      return `${moodTag}支出の${ratio}%が「${topCat.category}」。人との時間に投資する社交派。`;
    case 'strategist':
      return `${moodTag}支出の${ratio}%が「${topCat.category}」。未来を見据えた配分。`;
    case 'creator':
      return `${moodTag}支出の${ratio}%が「${topCat.category}」。好きを掘り下げる情熱型。`;
    case 'romantic':
      return `${moodTag}支出の${ratio}%が「${topCat.category}」。直感に素直な配分。`;
    case 'sage':
      return `${moodTag}カテゴリが偏らず、生活全体にお金が分散しています。`;
  }
}

function buildAdvice(
  personalityId: PersonalityId,
  top: Array<{ category: string; ratio: number }>,
  axes: Axes,
  bestGood: string | null,
  worstBad: string | null,
): string {
  const t1 = top[0]?.category ?? '';
  const t2 = top[1]?.category ?? '';
  const goodLine = bestGood
    ? `特に「${bestGood}」への支出は満足度が高い傾向。ここはむしろ予算を厚めにするのが正解。`
    : '';
  const badLine = worstBad
    ? `逆に「${worstBad}」は後悔の声が多め。次は買う前に 24 時間置いてみて。`
    : '';

  const fulfilledLine =
    axes.fulfilled >= 0.7
      ? 'お金の使い道に納得感があり、生活の手触りが整っています。'
      : axes.fulfilled <= 0.35
        ? '評価された買い物のうち後悔の割合が高めです。「なぜ買ったか」を一行でメモすると、自分のトリガーが見えてきます。'
        : '';

  switch (personalityId) {
    case 'entertainer':
      return [
        `あなたの「${t1}」への投資は、人間関係を耕すフィールドそのもの。`,
        '今月は、お気に入りの一軒で気の合う人と過ごす夜を、あえて予約してみてください。',
        t2
          ? `一方で「${t2}」とのバランスを意識すれば、社交が罪悪感なく楽しめます。`
          : '',
        goodLine,
        badLine,
        fulfilledLine,
      ]
        .filter(Boolean)
        .join('\n\n');

    case 'strategist':
      return [
        `「${t1}」への支出は、未来の自分への複利投資。続けるあなたを誇って大丈夫。`,
        '次の一歩は「自己投資の中で何が一番効いているか」を 3 ヶ月単位で振り返ること。',
        axes.social < 0.1
          ? 'たまには気の合う人と外でごはんを食べる時間を、戦略的に予算に組み込むのも◎。'
          : '',
        goodLine,
        badLine,
        fulfilledLine,
      ]
        .filter(Boolean)
        .join('\n\n');

    case 'creator':
      return [
        `「${t1}」への熱量こそがあなたの個性。ここを削る必要はありません。`,
        '推し活/趣味の中で「体験」と「モノ」の比率を月に一度だけ眺めてみて。',
        goodLine,
        badLine,
        fulfilledLine,
      ]
        .filter(Boolean)
        .join('\n\n');

    case 'romantic':
      return [
        `「${t1}」への支出は、あなたの感性が動いた証。`,
        '一晩寝かせるルール: 5,000 円を超える衝動買いは、24 時間カートに入れてから決済。',
        '欲しい気持ちが翌日も残っていたら、それは本物の「好き」。',
        goodLine,
        badLine,
        fulfilledLine,
      ]
        .filter(Boolean)
        .join('\n\n');

    case 'sage':
      return [
        '支出が見事に分散していて、生活そのものが整っています。',
        'バランス型のあなたは「無難に見えて、実は最強」。',
        'たまにはあえて一つのカテゴリに振り切る月をつくると、新しい自分が見つかります。',
        goodLine,
        badLine,
        fulfilledLine,
      ]
        .filter(Boolean)
        .join('\n\n');
  }
}

/**
 * 性格診断のメインエントリ。支出が無ければ null。
 * customs を渡すとユーザー定義カテゴリの kind を反映する。
 */
export function diagnose(
  transactions: Transaction[],
  customs?: Record<string, CategoryMeta>,
): PersonalityResult | null {
  const expenses = expensesOf(transactions);
  if (expenses.length === 0) return null;

  const total = totalAmount(expenses);
  if (total <= 0) return null;

  // カテゴリ別集計
  const byCategory = new Map<string, number>();
  const kindSums: Record<CategoryKind, number> = {
    dining: 0,
    daily: 0,
    social: 0,
    self_investment: 0,
    hobby: 0,
    impulse: 0,
    utility: 0,
    other: 0,
    income: 0,
  };
  let goodAmount = 0;
  let badAmount = 0;
  const goodPerCategory = new Map<string, number>();
  const badPerCategory = new Map<string, number>();

  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    const k = kindOf(e.category, customs);
    kindSums[k] += e.amount;
    if (e.satisfaction === 'good') {
      goodAmount += e.amount;
      goodPerCategory.set(
        e.category,
        (goodPerCategory.get(e.category) ?? 0) + e.amount,
      );
    } else if (e.satisfaction === 'bad') {
      badAmount += e.amount;
      badPerCategory.set(
        e.category,
        (badPerCategory.get(e.category) ?? 0) + e.amount,
      );
    }
  }

  const kindRatios = {} as Record<CategoryKind, number>;
  for (const k of Object.keys(kindSums) as CategoryKind[]) {
    kindRatios[k] = kindSums[k] / total;
  }

  const goodRatio = goodAmount / total;
  const badRatio = badAmount / total;
  const axes = computeAxes(kindRatios, goodRatio, badRatio);
  const personalityId = pickPersonality(axes);
  const type = PERSONALITIES[personalityId];

  const topCategories = Array.from(byCategory.entries())
    .map(([category, sum]) => ({ category, ratio: sum / total }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);

  // 推奨/警告として一番強いラベルを抽出
  let bestGood: string | null = null;
  let bestGoodAmount = 0;
  for (const [c, a] of goodPerCategory) {
    if (a > bestGoodAmount) {
      bestGoodAmount = a;
      bestGood = c;
    }
  }
  let worstBad: string | null = null;
  let worstBadAmount = 0;
  for (const [c, a] of badPerCategory) {
    if (a > worstBadAmount) {
      worstBadAmount = a;
      worstBad = c;
    }
  }

  const ax = [axes.social, axes.strategic, axes.passionate, axes.impulsive].sort(
    (a, b) => b - a,
  );
  const gap = ax[0] - ax[1];
  // 評価のついた支出が多いほど自信は上がる
  const evaluatedRatio = goodRatio + badRatio;
  const raw =
    personalityId === 'sage'
      ? axes.balanced * 100
      : ax[0] * 50 +
        gap * 160 +
        Math.min(expenses.length, 12) * 1.5 +
        evaluatedRatio * 18;
  const confidence = Math.max(20, Math.min(99, Math.round(raw)));

  const regretRatio =
    goodAmount + badAmount > 0
      ? badAmount / (goodAmount + badAmount)
      : 0;

  return {
    type,
    confidence,
    topCategories,
    axes,
    advice: buildAdvice(personalityId, topCategories, axes, bestGood, worstBad),
    summary: buildSummary(personalityId, topCategories, axes.fulfilled),
    regretRatio,
  };
}

export function totalExpense(transactions: Transaction[]): number {
  return totalAmount(expensesOf(transactions));
}

export function totalIncome(transactions: Transaction[]): number {
  return totalAmount(transactions.filter((t) => t.type === 'income'));
}

export function expenseSumsByCategory(
  transactions: Transaction[],
): Record<string, number> {
  const sums: Record<string, number> = {};
  for (const t of expensesOf(transactions)) {
    sums[t.category] = (sums[t.category] ?? 0) + t.amount;
  }
  return sums;
}
