import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAuthenticatedUser,
  getServiceSupabase,
  json,
} from './_lib.js';
import { callAi, currentMonthKey } from './_ai.js';

/**
 * POST /api/ai-coach
 * Authorization: Bearer <supabase_jwt>
 * Body: { question: string, context: AiContext }
 *
 * - 無料プラン: 月 3 回まで (ai_usage テーブルでカウント)
 * - Pro: 無制限
 * - 個人情報は送らない: 集計済み統計 + ユーザーの質問のみ
 */

const FREE_MONTHLY_LIMIT = 3;

interface AiContext {
  monthLabel: string;
  income: number;
  expense: number;
  net: number;
  topCategories: Array<{ category: string; amount: number; ratio: number }>;
  satisfaction: { good: number; bad: number; neutral: number };
  personality?: { name: string; tagline: string } | null;
  isPro: boolean;
}

function buildSystemPrompt(): string {
  return `あなたは「worthit」の AI パーソナル FP (ファイナンシャル・プランナー) です。
日本の家計簿アプリのユーザーに、優しく具体的なアドバイスを日本語で行います。

ルール:
- 必ず日本語で回答 (ユーザーが英語で聞いた場合は英語可)
- 投資・税金の専門的助言は避け、生活設計・支出見直し・心理的観点を中心に
- 数値はユーザー提供のデータからのみ引用
- 出力は Markdown。**bold** や箇条書きを使い、読みやすく
- 長すぎず、3-6 段落程度
- 押しつけがましくならず、ユーザーの選択を尊重する口調
- 「買って良かった👍 / 後悔👎」評価データを大切にし、価値観に基づくアドバイスを`;
}

function buildContextPrompt(ctx: AiContext): string {
  const lines: string[] = [
    `${ctx.monthLabel} のサマリー:`,
    `- 収入: ¥${ctx.income.toLocaleString('ja-JP')}`,
    `- 支出: ¥${ctx.expense.toLocaleString('ja-JP')}`,
    `- 差引: ¥${ctx.net.toLocaleString('ja-JP')}`,
    '',
    'トップカテゴリ:',
  ];
  for (const t of ctx.topCategories) {
    lines.push(
      `- ${t.category}: ¥${t.amount.toLocaleString('ja-JP')} (${Math.round(t.ratio * 100)}%)`,
    );
  }
  lines.push('');
  lines.push('満足度評価:');
  lines.push(`- 👍 良かった: ${ctx.satisfaction.good}件`);
  lines.push(`- 👎 後悔: ${ctx.satisfaction.bad}件`);
  lines.push(`- 未評価: ${ctx.satisfaction.neutral}件`);
  if (ctx.personality) {
    lines.push('');
    lines.push(
      `性格タイプ: ${ctx.personality.name} -「${ctx.personality.tagline}」`,
    );
  }
  return lines.join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }
  const user = await getAuthenticatedUser(req);
  if (!user) return json(res, 401, { error: 'unauthenticated' });

  const body = (req.body ?? {}) as {
    question?: string;
    context?: AiContext;
  };
  if (!body.question || !body.context) {
    return json(res, 400, { error: 'question_and_context_required' });
  }
  // 質問は 500 文字までに制限 (悪用防止)
  const question = String(body.question).slice(0, 500);

  const supabase = getServiceSupabase();
  const monthKey = currentMonthKey();

  // 無料枠チェック
  const isPro = body.context.isPro;
  let currentCount = 0;
  if (!isPro) {
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('month_key', monthKey)
      .maybeSingle();
    currentCount = usage?.count ?? 0;
    if (currentCount >= FREE_MONTHLY_LIMIT) {
      return json(res, 402, {
        error: 'free_quota_exhausted',
        used: currentCount,
        limit: FREE_MONTHLY_LIMIT,
      });
    }
  }

  // AI 呼び出し
  try {
    const result = await callAi([
      { role: 'system', content: buildSystemPrompt() },
      { role: 'system', content: buildContextPrompt(body.context) },
      { role: 'user', content: question },
    ]);

    // 利用回数をインクリメント (Pro でも記録は残す)
    await supabase.from('ai_usage').upsert(
      {
        user_id: user.id,
        month_key: monthKey,
        count: currentCount + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,month_key' },
    );

    return json(res, 200, {
      answer: result.text,
      provider: result.provider,
      used: currentCount + 1,
      limit: isPro ? null : FREE_MONTHLY_LIMIT,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(res, 500, { error: msg });
  }
}
