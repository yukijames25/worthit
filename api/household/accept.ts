import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAuthenticatedUser,
  getServiceSupabase,
  json,
} from '../_lib.js';

/**
 * POST /api/household/accept
 * Authorization: Bearer <supabase_jwt>
 * Body: { token: string }
 *
 * 招待トークンを検証し、現在ユーザーを world_members に追加する。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) return json(res, 401, { error: 'unauthenticated' });

  const body = (req.body ?? {}) as { token?: string };
  const token = body.token;
  if (!token || typeof token !== 'string') {
    return json(res, 400, { error: 'token_required' });
  }

  const supabase = getServiceSupabase();

  const { data: inv, error: e1 } = await supabase
    .from('household_invitations')
    .select('id, household_id, expires_at, used_at')
    .eq('token', token)
    .maybeSingle();
  if (e1) return json(res, 500, { error: e1.message });
  if (!inv) return json(res, 404, { error: 'invalid_token' });
  if (inv.used_at) return json(res, 410, { error: 'already_used' });
  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return json(res, 410, { error: 'expired' });
  }

  // 既に member なら no-op
  const { data: existing } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('household_id', inv.household_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    const { error: eIns } = await supabase.from('household_members').insert({
      household_id: inv.household_id,
      user_id: user.id,
      role: 'member',
    });
    if (eIns) return json(res, 500, { error: eIns.message });
  }

  // 招待を使用済みに
  await supabase
    .from('household_invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', inv.id);

  // 世帯名を返す
  const { data: household } = await supabase
    .from('households')
    .select('id, name')
    .eq('id', inv.household_id)
    .maybeSingle();

  return json(res, 200, {
    householdId: inv.household_id,
    householdName: household?.name ?? '家族',
  });
}
