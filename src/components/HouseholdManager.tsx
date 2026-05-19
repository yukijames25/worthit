import { useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  LogOut,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useHousehold, type Household } from '../context/HouseholdContext';
import { authedFetch } from '../lib/billing';

interface Props {
  open: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgrade: (feature?: string) => void;
}

export function HouseholdManager({ open, onClose, isPro, onUpgrade }: Props) {
  const {
    households,
    createHousehold,
    leaveHousehold,
    deleteHousehold,
    renameHousehold,
    switchScope,
  } = useHousehold();
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [busy, setBusy] = useState(false);
  const [inviteFor, setInviteFor] = useState<Household | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  /** 招待リンクの実取得部分。リトライ可能。 */
  const fetchInviteUrl = async (h: Household): Promise<void> => {
    setInviteUrl(null);
    setCopied(false);
    setError(null);
    setBusy(true);
    try {
      const res = await authedFetch('/api/household/invite', {
        method: 'POST',
        body: JSON.stringify({ householdId: h.id }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`${res.status}: ${t || 'Unknown error'}`);
      }
      const data = (await res.json()) as { url: string };
      setInviteUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!isPro) {
      onUpgrade('家族グループの作成');
      return;
    }
    if (!draftName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const h = await createHousehold(draftName.trim());
      if (h) {
        setCreating(false);
        setDraftName('');
        // ⭐ 作成後、すぐ招待リンク画面へ遷移して URL を取得
        setInviteFor(h);
        await fetchInviteUrl(h);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (h: Household) => {
    setInviteFor(h);
    await fetchInviteUrl(h);
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleLeave = async (h: Household) => {
    if (
      !window.confirm(
        `「${h.name}」から脱退します。あなたが作成した取引は残ります。よろしいですか？`,
      )
    )
      return;
    await leaveHousehold(h.id);
  };

  const handleDelete = async (h: Household) => {
    if (
      !window.confirm(
        `「${h.name}」を削除します。共有された取引はすべて消えます。よろしいですか？`,
      )
    )
      return;
    await deleteHousehold(h.id);
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
        aria-label="家族グループの管理"
        className={[
          'absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px]',
          'bg-white text-ink-900 dark:bg-night-900 dark:text-night-100',
          'shadow-ios-lg animate-sheet-up safe-bottom',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 pt-2 pb-3 px-5 bg-white/95 dark:bg-night-900/95 backdrop-blur-xl">
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-200 dark:bg-night-600 mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-[1.0625rem] font-bold">家族グループ</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="tap-shrink size-9 rounded-full bg-ink-100 dark:bg-night-700 flex items-center justify-center text-ink-600 dark:text-night-200"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[0.6875rem] text-ink-500 dark:text-night-300 mt-1">
            家族や同居人とトランザクションを共有・共同編集できます
          </p>
        </div>

        {/* 招待発行モード */}
        {inviteFor && (
          <div className="px-5 pb-6">
            <button
              type="button"
              onClick={() => {
                setInviteFor(null);
                setInviteUrl(null);
              }}
              className="text-[0.75rem] text-ink-500 dark:text-night-300 mb-3"
            >
              ← 戻る
            </button>
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-amber-50 dark:from-brand-500/10 dark:to-amber-500/10 p-4 border border-brand-200/50 dark:border-brand-500/30">
              <div className="text-[0.8125rem] font-semibold mb-1">
                「{inviteFor.name}」への招待リンク
              </div>
              {inviteUrl ? (
                <>
                  <div className="mt-3 break-all text-[0.6875rem] text-ink-700 dark:text-night-200 bg-white dark:bg-night-800 rounded-xl p-2.5 font-mono">
                    {inviteUrl}
                  </div>
                  <button
                    type="button"
                    onClick={copyInvite}
                    className="tap-shrink mt-3 w-full rounded-2xl py-2.5 font-semibold text-[0.8125rem] text-white bg-gradient-to-br from-brand-500 to-brand-400 shadow-ios flex items-center justify-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        コピーしました
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        リンクをコピー
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-[0.625rem] text-ink-500 dark:text-night-400 leading-relaxed">
                    LINE / メール / Slack で送ってください。7日間有効・1度きり使用可能です。
                  </p>
                </>
              ) : busy ? (
                <div className="mt-3 text-[0.75rem] text-ink-500 dark:text-night-300">
                  ⏳ 招待リンクを生成中…
                </div>
              ) : error ? (
                <>
                  <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 px-3 py-2 text-[0.6875rem]">
                    ⚠️ {error}
                  </div>
                  <button
                    type="button"
                    onClick={() => inviteFor && void fetchInviteUrl(inviteFor)}
                    className="tap-shrink mt-2 w-full rounded-2xl py-2.5 font-semibold text-[0.8125rem] bg-white dark:bg-night-800 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30"
                  >
                    🔄 もう一度試す
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => inviteFor && void fetchInviteUrl(inviteFor)}
                  className="tap-shrink mt-3 w-full rounded-2xl py-2.5 font-semibold text-[0.8125rem] text-white bg-gradient-to-br from-brand-500 to-brand-400 shadow-ios"
                >
                  招待リンクを発行
                </button>
              )}
            </div>
          </div>
        )}

        {/* メインリスト */}
        {!inviteFor && (
          <div className="px-5 pb-6 space-y-3">
            {/* 作成 */}
            {creating ? (
              <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5">
                <label className="block text-[0.75rem] font-semibold text-ink-500 dark:text-night-300 mb-1.5">
                  グループ名
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="例: 家族, 妻と"
                  maxLength={30}
                  autoFocus
                  className="w-full rounded-xl px-3 py-2.5 text-[0.875rem] bg-white border border-ink-200 dark:bg-night-800 dark:border-night-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setDraftName('');
                    }}
                    className="tap-shrink rounded-xl py-2 text-[0.8125rem] font-semibold bg-ink-100 dark:bg-night-700 text-ink-600 dark:text-night-300"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    disabled={busy || !draftName.trim()}
                    onClick={() => void handleCreate()}
                    className={[
                      'tap-shrink rounded-xl py-2 text-[0.8125rem] font-semibold transition',
                      busy || !draftName.trim()
                        ? 'bg-ink-200 text-ink-400 cursor-not-allowed dark:bg-night-700 dark:text-night-500'
                        : 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios',
                    ].join(' ')}
                  >
                    {busy ? '作成中…' : '作成'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    onUpgrade('家族グループの作成');
                  } else {
                    setCreating(true);
                  }
                }}
                className={[
                  'tap-shrink w-full rounded-2xl py-3 flex items-center justify-center gap-1.5 font-semibold shadow-ios',
                  isPro
                    ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-white'
                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 border-2 border-dashed border-amber-300',
                ].join(' ')}
              >
                <UserPlus size={16} strokeWidth={2.6} />
                家族グループを作成
                {!isPro && (
                  <span className="text-[0.625rem] font-bold tracking-wide rounded-full px-1.5 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    PRO
                  </span>
                )}
              </button>
            )}

            {error && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 px-3 py-2 text-[0.75rem]">
                {error}
              </div>
            )}

            {households.length === 0 ? (
              <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 p-5 text-center">
                <div className="mx-auto size-12 rounded-2xl bg-gradient-to-br from-pink-300 to-violet-500 flex items-center justify-center text-white shadow-ios">
                  <Users size={22} strokeWidth={2.2} />
                </div>
                <p className="mt-3 text-[0.8125rem] font-semibold">
                  まだ家族グループがありません
                </p>
                <p className="mt-1 text-[0.6875rem] text-ink-500 dark:text-night-300 leading-relaxed">
                  作成すると招待リンクを発行できます。
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {households.map((h) => (
                  <HouseholdRow
                    key={h.id}
                    household={h}
                    onSelect={() => {
                      switchScope(h.id);
                      onClose();
                    }}
                    onRename={(name) => void renameHousehold(h.id, name)}
                    onInvite={() => void handleInvite(h)}
                    onLeave={() => void handleLeave(h)}
                    onDelete={() => void handleDelete(h)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HouseholdRow({
  household,
  onSelect,
  onRename,
  onInvite,
  onLeave,
  onDelete,
}: {
  household: Household;
  onSelect: () => void;
  onRename: (name: string) => void;
  onInvite: () => void;
  onLeave: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(household.name);
  return (
    <li className="rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white shadow-ios shrink-0">
          {household.isOwner ? (
            <Crown size={16} strokeWidth={2.4} />
          ) : (
            <Users size={16} strokeWidth={2.4} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (draft.trim() && draft.trim() !== household.name) {
                  onRename(draft.trim());
                }
                setEditing(false);
              }}
              autoFocus
              className="w-full text-[0.9375rem] font-semibold bg-transparent focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(household.isOwner)}
              className="text-left text-[0.9375rem] font-semibold truncate w-full"
            >
              {household.name}
            </button>
          )}
          <div className="text-[0.625rem] text-ink-500 dark:text-night-300 tabular-nums">
            {household.memberCount}人 · {household.isOwner ? 'オーナー' : 'メンバー'}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <button
          type="button"
          onClick={onSelect}
          className="tap-shrink flex-1 rounded-xl py-2 text-[0.75rem] font-semibold text-white bg-gradient-to-br from-brand-500 to-brand-400 shadow-ios"
        >
          このグループを表示
        </button>
        {household.isOwner && (
          <>
            <button
              type="button"
              onClick={onInvite}
              aria-label="招待"
              className="tap-shrink size-8 rounded-xl bg-white dark:bg-night-800 text-ink-600 dark:text-night-200 flex items-center justify-center"
            >
              <UserPlus size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="削除"
              className="tap-shrink size-8 rounded-xl bg-white dark:bg-night-800 text-rose-500 dark:text-rose-300 flex items-center justify-center"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
        {!household.isOwner && (
          <button
            type="button"
            onClick={onLeave}
            aria-label="脱退"
            className="tap-shrink size-8 rounded-xl bg-white dark:bg-night-800 text-rose-500 dark:text-rose-300 flex items-center justify-center"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </li>
  );
}
