import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import type { PersonalityResult, Transaction } from '../types';
import { aggregateMonth, monthRangeOf } from '../utils/period';
import { satisfactionTally } from '../utils/advice';
import { authedFetch } from '../lib/billing';

interface Props {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  result: PersonalityResult | null;
  isPro: boolean;
  onUpgrade: (feature?: string) => void;
}

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

const PRESET_PROMPTS = [
  '今月の支出傾向を一言でまとめて',
  'もっと満足度を上げるには何を変えるべき？',
  '節約できそうなカテゴリは？',
  '自分の性格タイプに合った貯蓄戦略は？',
];

export function AiCoachSheet({
  open,
  onClose,
  transactions,
  result,
  isPro,
  onUpgrade,
}: Props) {
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState<{ count: number; limit: number | null }>({
    count: 0,
    limit: null,
  });
  const scrollerRef = useRef<HTMLDivElement>(null);

  // 開く度にリセット (履歴を保持したい場合はここを変える)
  useEffect(() => {
    if (open) {
      setDraft('');
      setError(null);
    }
  }, [open]);

  // 新しいターンが入ったら下までスクロール
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [turns, busy]);

  const aiContext = useMemo(() => {
    const range = monthRangeOf(Date.now());
    const agg = aggregateMonth(transactions, range);
    const tally = satisfactionTally(
      transactions.filter((t) => t.date >= range.start && t.date < range.end),
    );
    const totalExp = agg.expense || 1;
    return {
      monthLabel: range.label,
      income: agg.income,
      expense: agg.expense,
      net: agg.net,
      topCategories: agg.topCategories.slice(0, 5).map((c) => ({
        category: c.category,
        amount: c.amount,
        ratio: c.amount / totalExp,
      })),
      satisfaction: {
        good: tally.good,
        bad: tally.bad,
        neutral: tally.neutral,
      },
      personality: result
        ? { name: result.type.name, tagline: result.type.tagline }
        : null,
      isPro,
    };
  }, [transactions, result, isPro]);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setError(null);
    setBusy(true);
    setTurns((prev) => [...prev, { role: 'user', content: question }]);
    try {
      const res = await authedFetch('/api/ai-coach', {
        method: 'POST',
        body: JSON.stringify({ question, context: aiContext }),
      });
      if (res.status === 402) {
        // 無料枠切れ
        const data = (await res.json()) as { used: number; limit: number };
        setUsed({ count: data.used, limit: data.limit });
        setTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `今月の無料利用枠 (${data.limit}回) を使い切りました。Pro にアップグレードすると無制限に質問できます。`,
          },
        ]);
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`AI 失敗 (${res.status}): ${text.slice(0, 200)}`);
      }
      const data = (await res.json()) as {
        answer: string;
        used: number;
        limit: number | null;
      };
      setTurns((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      setUsed({ count: data.used, limit: data.limit });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

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
        aria-label="AI パーソナル FP"
        className={[
          'absolute inset-x-0 bottom-0 max-h-[92vh] flex flex-col rounded-t-[28px]',
          'bg-white text-ink-900 dark:bg-night-900 dark:text-night-100',
          'shadow-ios-lg animate-sheet-up safe-bottom',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 pt-2 pb-3 px-5 bg-white/95 dark:bg-night-900/95 backdrop-blur-xl shrink-0">
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-200 dark:bg-night-600 mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-xl flex items-center justify-center text-white shadow-ios bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <Bot size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-[1rem] font-bold leading-tight">
                  AI パーソナル FP
                </h2>
                <div className="text-[0.625rem] text-ink-400 dark:text-night-400">
                  {isPro
                    ? '無制限'
                    : used.limit
                      ? `今月 ${used.count}/${used.limit} 回利用`
                      : '無料 3回/月'}
                </div>
              </div>
            </div>
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

        {/* メッセージ表示エリア */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
        >
          {turns.length === 0 ? (
            <Intro
              onPick={(q) => void ask(q)}
              hasData={transactions.length > 0}
            />
          ) : (
            turns.map((t, i) => (
              <MessageBubble key={i} role={t.role} content={t.content} />
            ))
          )}
          {busy && (
            <div className="flex items-center gap-2 text-[0.75rem] text-ink-500 dark:text-night-300">
              <Sparkles size={12} className="animate-pulse" />
              FP が考えています…
            </div>
          )}
          {error && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 px-3.5 py-2.5 text-[0.75rem]">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* 入力 */}
        <div className="px-5 pt-3 pb-3 border-t border-ink-100 dark:border-night-700 bg-white/95 dark:bg-night-900/95 backdrop-blur-xl shrink-0">
          {!isPro && used.limit && used.count >= used.limit && (
            <button
              type="button"
              onClick={() => onUpgrade('AI パーソナル FP 無制限')}
              className="tap-shrink mb-2 w-full rounded-2xl py-2.5 text-[0.75rem] font-bold bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-ios"
            >
              👑 Pro で無制限に質問する
            </button>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const q = draft;
                  setDraft('');
                  void ask(q);
                }
              }}
              placeholder="FP に質問してみる…"
              maxLength={500}
              className="flex-1 rounded-2xl px-4 py-3 text-[0.875rem] bg-ink-50 dark:bg-night-700/50 text-ink-900 dark:text-night-100 placeholder:text-ink-400 dark:placeholder:text-night-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => {
                const q = draft;
                setDraft('');
                void ask(q);
              }}
              disabled={busy || !draft.trim()}
              aria-label="送信"
              className={[
                'tap-shrink size-12 rounded-2xl flex items-center justify-center transition shrink-0',
                busy || !draft.trim()
                  ? 'bg-ink-200 text-ink-400 dark:bg-night-700 dark:text-night-500'
                  : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-ios',
              ].join(' ')}
            >
              <Send size={16} strokeWidth={2.4} />
            </button>
          </div>
          <p className="mt-2 text-[0.625rem] text-ink-400 dark:text-night-400 text-center leading-relaxed">
            送信されるデータは集計済み統計のみ (個別取引や個人情報は含まれません)
          </p>
        </div>
      </div>
    </div>
  );
}

function Intro({
  onPick,
  hasData,
}: {
  onPick: (q: string) => void;
  hasData: boolean;
}) {
  return (
    <div className="text-center py-6">
      <div className="mx-auto size-16 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-ios-lg">
        <Bot size={30} strokeWidth={2.2} />
      </div>
      <h3 className="mt-4 text-[1.0625rem] font-bold">あなたの専属 FP です</h3>
      <p className="mt-1 text-[0.75rem] text-ink-500 dark:text-night-300 leading-relaxed px-3">
        あなたの支出傾向と満足度評価を元に、優しくアドバイスします。
      </p>
      {hasData ? (
        <div className="mt-5 space-y-2 text-left">
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPick(p)}
              className="tap-shrink w-full rounded-2xl px-3.5 py-2.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-200 text-[0.8125rem] font-medium text-left"
            >
              💬 {p}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-[0.75rem] text-ink-400 dark:text-night-400">
          いくつか記録を追加すると、より具体的なアドバイスができます。
        </p>
      )}
    </div>
  );
}

function MessageBubble({
  role,
  content,
}: {
  role: 'user' | 'assistant';
  content: string;
}) {
  const isUser = role === 'user';
  return (
    <div className={['flex', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      <div
        className={[
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.84375rem] leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
            : 'bg-ink-50 dark:bg-night-700/50 text-ink-900 dark:text-night-100',
        ].join(' ')}
      >
        {/* シンプルなインライン Markdown 風処理 */}
        {content.split('\n').map((line, i) => (
          <Line key={i} text={line} />
        ))}
      </div>
    </div>
  );
}

function Line({ text }: { text: string }) {
  // **bold** をパース
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <strong key={i} className="font-bold">
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </div>
  );
}
