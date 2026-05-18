import type {
  CategoryInsight,
  Recommendation,
  Transaction,
} from '../types';

/**
 * 「次にお金を使うべきもの / 控えるべきもの」を計算するロジック。
 *
 * good 評価 vs bad 評価の額の差分をベースに、件数も加味して
 * カテゴリごとのおすすめ度を -1..+1 のスコアで返す。
 */

export function buildCategoryInsights(
  transactions: Transaction[],
): CategoryInsight[] {
  const map = new Map<string, CategoryInsight>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    let entry = map.get(t.category);
    if (!entry) {
      entry = {
        category: t.category,
        total: 0,
        count: 0,
        goodAmount: 0,
        badAmount: 0,
        neutralAmount: 0,
        score: 0,
      };
      map.set(t.category, entry);
    }
    entry.total += t.amount;
    entry.count += 1;
    if (t.satisfaction === 'good') entry.goodAmount += t.amount;
    else if (t.satisfaction === 'bad') entry.badAmount += t.amount;
    else entry.neutralAmount += t.amount;
  }
  for (const entry of map.values()) {
    const evaluated = entry.goodAmount + entry.badAmount;
    entry.score = evaluated > 0 ? (entry.goodAmount - entry.badAmount) / evaluated : 0;
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

interface SplitRecs {
  recommended: Recommendation[];
  warnings: Recommendation[];
}

/**
 * トップ N の推奨カテゴリと警告カテゴリを返す。
 * 評価がついていないカテゴリは含めない（情報が無いと判断不能）。
 */
export function buildRecommendations(
  transactions: Transaction[],
  limit = 3,
): SplitRecs {
  const insights = buildCategoryInsights(transactions);
  const goodRanked = insights
    .filter((i) => i.goodAmount > 0 && i.score > 0.1)
    .map(toRec)
    .sort((a, b) => b.score * b.amount - a.score * a.amount)
    .slice(0, limit);

  const badRanked = insights
    .filter((i) => i.badAmount > 0 && i.score < -0.1)
    .map(toRec)
    .sort((a, b) => a.score * a.amount - b.score * b.amount)
    .slice(0, limit);

  return { recommended: goodRanked, warnings: badRanked };
}

function toRec(i: CategoryInsight): Recommendation {
  return {
    category: i.category,
    amount: i.total,
    score: i.score,
    goodCount: i.goodAmount > 0 ? 1 : 0,
    badCount: i.badAmount > 0 ? 1 : 0,
  };
}

/** カテゴリ単体の short reason 文。 */
export function reasonForRecommendation(rec: Recommendation, kind: 'good' | 'bad'): string {
  const pct = Math.abs(Math.round(rec.score * 100));
  if (kind === 'good') {
    return `満足度 ${pct}% — 自分を幸せにする支出として続ける価値があります。`;
  }
  return `後悔率 ${pct}% — 次に手が伸びたら、買う前にひと呼吸。`;
}

/** 全体の good/bad/neutral 件数集計。 */
export function satisfactionTally(transactions: Transaction[]) {
  let good = 0;
  let bad = 0;
  let neutral = 0;
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (t.satisfaction === 'good') good += 1;
    else if (t.satisfaction === 'bad') bad += 1;
    else neutral += 1;
  }
  return { good, bad, neutral, total: good + bad + neutral };
}
