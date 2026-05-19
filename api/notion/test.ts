import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedUser, json } from '../_lib.js';
import { postTransactionToNotion } from './_postPage.js';

/**
 * POST /api/notion/test
 * Authorization: Bearer <supabase_jwt>
 * Body: { token: string, databaseId: string }
 *
 * 設定値を実際に試して、テスト用ページを Notion に 1 件作成。
 * クライアント側で「接続テスト」ボタンとして使う。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) return json(res, 401, { error: 'unauthenticated' });

  const body = (req.body ?? {}) as { token?: string; databaseId?: string };
  if (!body.token || !body.databaseId) {
    return json(res, 400, { error: 'token_and_databaseId_required' });
  }

  try {
    await postTransactionToNotion(body.databaseId, body.token, {
      date: Date.now(),
      amount: 0,
      category: '✓ worthit テスト',
      memo: 'これはテストエントリです (削除しても OK)',
      type: 'expense',
      satisfaction: 'neutral',
    });
    return json(res, 200, { ok: true });
  } catch (e) {
    return json(res, 400, {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
