import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAuthenticatedUser,
  getServiceSupabase,
  json,
} from '../_lib.js';
import { postTransactionToNotion } from './_postPage.js';

/**
 * POST /api/notion/sync
 * Authorization: Bearer <supabase_jwt>
 * Body: { transactionId: string }
 *
 * 該当ユーザーの Notion 設定を引き、トランザクションを Notion DB にページとして追加。
 * 失敗時は notion_integrations.last_error を更新するが、HTTP は 200 を返す (UI は非ブロッキング想定)。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) return json(res, 401, { error: 'unauthenticated' });

  const body = (req.body ?? {}) as { transactionId?: string };
  const transactionId = body.transactionId;
  if (!transactionId || typeof transactionId !== 'string') {
    return json(res, 400, { error: 'transactionId_required' });
  }

  const supabase = getServiceSupabase();

  const [{ data: integration }, { data: tx }] = await Promise.all([
    supabase
      .from('notion_integrations')
      .select('api_token, database_id, enabled')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('transactions')
      .select('id, type, amount, category, memo, date, satisfaction')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (!integration || !integration.enabled) {
    return json(res, 200, { skipped: 'not_enabled' });
  }
  if (!tx) {
    return json(res, 404, { error: 'transaction_not_found' });
  }

  try {
    await postTransactionToNotion(
      integration.database_id,
      integration.api_token,
      {
        date: new Date(tx.date).getTime(),
        amount: tx.amount,
        category: tx.category,
        memo: tx.memo ?? '',
        type: tx.type === 'income' ? 'income' : 'expense',
        satisfaction:
          tx.satisfaction === 'good' || tx.satisfaction === 'bad'
            ? tx.satisfaction
            : 'neutral',
      },
    );
    await supabase
      .from('notion_integrations')
      .update({
        last_synced: new Date().toISOString(),
        last_error: null,
      })
      .eq('user_id', user.id);
    return json(res, 200, { ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from('notion_integrations')
      .update({ last_error: msg.slice(0, 500) })
      .eq('user_id', user.id);
    return json(res, 200, { ok: false, error: msg });
  }
}
