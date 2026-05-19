import { useEffect, useState } from 'react';
import { getSignedReceiptUrl } from '../lib/storage';

/** path に対応する signed URL を 1 時間 TTL で取得する。 */
const cache = new Map<string, { url: string; expiresAt: number }>();
const TTL_MS = 55 * 60 * 1000; // 55min (TTL より少し短めにキャッシュ)

export function useReceiptThumbnail(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!path) return null;
    const cached = cache.get(path);
    return cached && cached.expiresAt > Date.now() ? cached.url : null;
  });

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    const cached = cache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      setUrl(cached.url);
      return;
    }
    let cancelled = false;
    void getSignedReceiptUrl(path).then((u) => {
      if (cancelled || !u) return;
      cache.set(path, { url: u, expiresAt: Date.now() + TTL_MS });
      setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
