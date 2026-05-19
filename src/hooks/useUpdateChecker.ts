import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Vercel に新しいバージョンがデプロイされたかをポーリングで検出する。
 *
 * 仕組み:
 *  - 起動時に <script type="module" src="/assets/index-XXXX.js"> から
 *    現在のバンドルパスを記録
 *  - 定期的に `/index.html` を no-store で取得し、HTML 内の同じスクリプトタグを抽出
 *  - 異なれば「更新あり」とフラグを立てる
 *
 * dev モードではバンドルパスが安定しないので無効化。
 */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const BUNDLE_REGEX = /\/assets\/index-[A-Za-z0-9_-]+\.js/;

function readCurrentBundle(): string | null {
  if (typeof document === 'undefined') return null;
  const scripts = Array.from(
    document.querySelectorAll('script[type="module"]'),
  ) as HTMLScriptElement[];
  for (const s of scripts) {
    const m = s.src.match(BUNDLE_REGEX);
    if (m) return m[0];
  }
  return null;
}

async function fetchLatestBundle(): Promise<string | null> {
  try {
    const res = await fetch(`/index.html?ts=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(BUNDLE_REGEX);
    return m ? m[0] : null;
  } catch {
    return null;
  }
}

export function useUpdateChecker() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const currentRef = useRef<string | null>(null);

  const check = useCallback(async () => {
    if (!currentRef.current) return;
    const latest = await fetchLatestBundle();
    if (!latest) return;
    if (latest !== currentRef.current) {
      setHasUpdate(true);
    }
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (typeof window === 'undefined') return;
    currentRef.current = readCurrentBundle();
    if (!currentRef.current) return;

    // 起動直後にも一度
    void check();

    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [check]);

  const apply = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  return { hasUpdate, apply };
}
