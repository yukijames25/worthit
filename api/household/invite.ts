import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import {
  getAppOrigin,
  getAuthenticatedUser,
  getServiceSupabase,
  json,
} from '../_lib.js';

/**
 * POST /api/household/invite
 * Authorization: Bearer <supabase_jwt>
 * Body: { householdId: string }
 *
 * オーナーのみが招待リンク (token 入り URL) を発行できる。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) return json(res, 401, { error: 'unauthenticated' });

  const body = (req.body ?? {}) as { householdId?: string };
  const householdId = body.householdId;
  if (!householdId || typeof householdId !== 'string') {
    return json(res, 400, { error: 'householdId_required' });
  }

  const supabase = getServiceSupabase();

  // 呼び出し元がオーナーかチェック
  const { data: household, error: e1 } = await supabase
    .from('households')
    .select('id, owner_id, name')
    .eq('id', householdId)
    .maybeSingle();
  if (e1) return json(res, 500, { error: e1.message });
  if (!household) return json(res, 404, { error: 'household_not_found' });
  if (household.owner_id !== user.id) {
    return json(res, 403, { error: 'not_owner' });
  }

  // URL-safe な 32 文字のトークン生成
  const token = randomBytes(24).toString('base64url');

  const { error: e2 } = await supabase.from('household_invitations').insert({
    household_id: householdId,
    token,
    created_by: user.id,
  });
  if (e2) return json(res, 500, { error: e2.message });

  const origin = getAppOrigin(req);
  return json(res, 200, {
    url: `${origin}/?invite=${token}`,
    token,
    householdName: household.name,
  });
}
