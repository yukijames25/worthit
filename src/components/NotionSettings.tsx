import { useEffect, useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { useNotionIntegration } from '../hooks/useNotionIntegration';
import { authedFetch } from '../lib/billing';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotionSettings({ open, onClose }: Props) {
  const { integration, save, toggle, disconnect, refresh } = useNotionIntegration();
  const [token, setToken] = useState('');
  const [dbId, setDbId] = useState('');
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<
    null | { ok: true } | { ok: false; error: string }
  >(null);

  useEffect(() => {
    if (open) {
      setToken(integration?.apiToken ?? '');
      setDbId(integration?.databaseId ?? '');
      setTestResult(null);
    }
  }, [open, integration]);

  if (!open) return null;

  const handleTest = async () => {
    if (!token || !dbId) return;
    setBusy(true);
    setTestResult(null);
    try {
      const res = await authedFetch('/api/notion/test', {
        method: 'POST',
        body: JSON.stringify({ token, databaseId: dbId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setTestResult({ ok: true });
      } else {
        setTestResult({ ok: false, error: data.error ?? 'Unknown error' });
      }
    } catch (e) {
      setTestResult({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!token || !dbId) return;
    setBusy(true);
    try {
      await save({ apiToken: token.trim(), databaseId: dbId.trim() });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notion 連携"
        className={[
          'absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px]',
          'bg-white text-ink-900 dark:bg-night-900 dark:text-night-100',
          'shadow-ios-lg animate-sheet-up safe-bottom',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 pt-2 pb-3 px-5 bg-white/95 dark:bg-night-900/95 backdrop-blur-xl">
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-200 dark:bg-night-600 mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-[1.0625rem] font-bold">Notion 連携</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="tap-shrink size-9 rounded-full bg-ink-100 dark:bg-night-700 flex items-center justify-center text-ink-600 dark:text-night-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* 接続ステータス */}
          {integration && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-3.5 border border-emerald-200/50 dark:border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600 dark:text-emerald-300" />
                <div className="text-[0.875rem] font-semibold text-emerald-700 dark:text-emerald-200">
                  接続中
                </div>
              </div>
              {integration.lastSynced && (
                <div className="text-[0.6875rem] text-emerald-700/80 dark:text-emerald-300/80 mt-1 tabular-nums">
                  最終同期: {new Date(integration.lastSynced).toLocaleString()}
                </div>
              )}
              {integration.lastError && (
                <div className="mt-1.5 text-[0.6875rem] text-amber-700 dark:text-amber-300">
                  ⚠️ {integration.lastError}
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void toggle(!integration.enabled)}
                  className="tap-shrink rounded-full px-3 py-1 text-[0.6875rem] font-semibold bg-white dark:bg-night-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                >
                  {integration.enabled ? '一時停止' : '再開'}
                </button>
                <button
                  type="button"
                  onClick={() => void disconnect()}
                  className="tap-shrink rounded-full px-3 py-1 text-[0.6875rem] font-semibold bg-white dark:bg-night-800 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                >
                  連携を解除
                </button>
              </div>
            </div>
          )}

          {/* ガイド */}
          <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 text-[0.75rem] text-ink-600 dark:text-night-200 leading-relaxed space-y-2">
            <p>
              <strong>1.</strong> Notion で
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-brand-600 dark:text-brand-300 font-semibold"
              >
                インテグレーションを作成
                <ExternalLink size={10} />
              </a>
              して
              <strong>「内部統合シークレット」</strong>(`secret_...`) をコピー。
            </p>
            <p>
              <strong>2.</strong> Notion で新しいデータベースを作り、プロパティに
              <code className="text-[0.6875rem] bg-white dark:bg-night-800 px-1.5 py-0.5 rounded">
                Date / Amount / Category / Memo / Type / Satisfaction
              </code>
              を追加。
            </p>
            <p>
              <strong>3.</strong> DB 右上の「⋯」→「接続を追加」で 1 のインテグレーションを許可。
            </p>
            <p>
              <strong>4.</strong> DB の URL から ID
              (`https://notion.so/<strong>xxxxxxxx</strong>?v=...` の太字部分) をコピー。
            </p>
          </div>

          {/* フォーム */}
          <section>
            <label className="block text-[0.8125rem] font-bold mb-1.5">
              インテグレーションシークレット
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="secret_..."
              className="w-full rounded-2xl px-4 py-3 text-[0.875rem] font-mono bg-white border border-ink-100 shadow-ios text-ink-900 dark:bg-night-800 dark:border-night-700 dark:text-night-100 focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
            />
          </section>

          <section>
            <label className="block text-[0.8125rem] font-bold mb-1.5">
              データベース ID
            </label>
            <input
              type="text"
              value={dbId}
              onChange={(e) => setDbId(e.target.value)}
              placeholder="32文字のID"
              className="w-full rounded-2xl px-4 py-3 text-[0.875rem] font-mono bg-white border border-ink-100 shadow-ios text-ink-900 dark:bg-night-800 dark:border-night-700 dark:text-night-100 focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
            />
          </section>

          {/* テスト結果 */}
          {testResult && (
            <div
              className={[
                'rounded-2xl p-3 text-[0.75rem]',
                testResult.ok
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200',
              ].join(' ')}
            >
              {testResult.ok
                ? '✅ テスト成功！Notion DB に「worthit テスト」のページが作られました。'
                : `❌ 接続失敗: ${testResult.error}`}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handleTest()}
              disabled={busy || !token || !dbId}
              className={[
                'tap-shrink rounded-2xl py-3 text-[0.8125rem] font-semibold',
                'bg-ink-100 dark:bg-night-700 text-ink-700 dark:text-night-200',
                busy || !token || !dbId ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {busy ? 'テスト中…' : '接続テスト'}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy || !token || !dbId}
              className={[
                'tap-shrink rounded-2xl py-3 text-[0.8125rem] font-semibold transition',
                busy || !token || !dbId
                  ? 'bg-ink-200 text-ink-400 cursor-not-allowed dark:bg-night-700 dark:text-night-500'
                  : 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios',
              ].join(' ')}
            >
              {busy ? '保存中…' : '保存して有効化'}
            </button>
          </div>

          <p className="text-[0.625rem] text-ink-400 dark:text-night-400 leading-relaxed">
            🔒 シークレットは Supabase の安全なテーブルに保存され、Notion へのページ作成時のみ Vercel Functions が使用します。
          </p>
        </div>
      </div>
    </div>
  );
}
