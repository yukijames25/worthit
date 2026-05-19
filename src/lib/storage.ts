import { supabase } from './supabase';

const BUCKET = 'receipts';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h

/** ファイル拡張子を MIME から推定。 */
function extensionFor(mime: string): string {
  if (mime.startsWith('image/jpeg')) return 'jpg';
  if (mime.startsWith('image/png')) return 'png';
  if (mime.startsWith('image/webp')) return 'webp';
  if (mime.startsWith('image/heic')) return 'heic';
  return 'jpg';
}

/**
 * receipts バケットに画像をアップロード。
 * パス規約: {user_id}/{transaction_id}.{ext}
 *
 * @returns 保存パス。後で getSignedReceiptUrl(path) で表示できる。
 */
export async function uploadReceipt(
  userId: string,
  transactionId: string,
  blob: Blob,
): Promise<string> {
  if (!supabase) throw new Error('Cloud sync is not configured.');
  const ext = extensionFor(blob.type);
  const path = `${userId}/${transactionId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw error;
  return path;
}

/** 表示用の一時 URL を発行。 */
export async function getSignedReceiptUrl(
  path: string,
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function deleteReceipt(path: string): Promise<void> {
  if (!supabase) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
