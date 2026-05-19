import { forwardRef } from 'react';
import type { PersonalityResult, Transaction } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { buildRecommendations, satisfactionTally } from '../utils/advice';
import { aggregateMonth, monthRangeOf } from '../utils/period';
import { formatYen, toDateKey } from '../utils/format';

interface Props {
  /** PDF を作る対象の月 (ms timestamp)。デフォルトは今月。 */
  monthRef: number;
  transactions: Transaction[];
  result: PersonalityResult | null;
  /** ユーザー名 / ハンドル — 表紙に出す任意要素。 */
  userName?: string | null;
  customsMap?: Record<string, { color: string; emoji: string; gradient: string }>;
}

/**
 * worthit の PDF レポートテンプレート。
 * ・固定幅 720px (≈ A4縦の幅) で描画される
 * ・html2canvas で画像化される前提なのでアニメーション等は省略
 * ・ライトテーマ固定 (PDF 上ではダークモードは見づらいため)
 */
export const PdfReportTemplate = forwardRef<HTMLDivElement, Props>(
  function PdfReportTemplate({ monthRef, transactions, result, userName }, ref) {
    const range = monthRangeOf(monthRef);
    const agg = aggregateMonth(transactions, range);
    const tally = satisfactionTally(
      transactions.filter((t) => t.date >= range.start && t.date < range.end),
    );
    const { recommended, warnings } = buildRecommendations(
      transactions.filter((t) => t.date >= range.start && t.date < range.end),
      3,
    );

    const evaluated = agg.good + agg.bad;
    const fulfilled = evaluated > 0 ? agg.good / evaluated : 0;
    const generatedAt = toDateKey(Date.now());

    const totalForRatio = agg.expense || 1;
    const topCats = agg.topCategories.slice(0, 5);

    return (
      <div
        ref={ref}
        style={{
          width: 720,
          padding: 40,
          background: '#ffffff',
          color: '#0f1115',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", system-ui, sans-serif',
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {/* ヘッダ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
            paddingBottom: 16,
            borderBottom: '2px solid #e2e5ec',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#ff2e83',
              }}
            >
              🪙 worthit · Monthly Report
            </div>
            <div
              style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#0f1115' }}
            >
              {range.year}年 {range.month}月
            </div>
            {userName && (
              <div style={{ fontSize: 13, color: '#5b6170', marginTop: 2 }}>
                for {userName}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#8a90a0' }}>
            Generated {generatedAt}
            <div style={{ marginTop: 4 }}>worthit-sigma.vercel.app</div>
          </div>
        </div>

        {/* サマリー */}
        <Section title="今月のサマリー">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            <Stat
              label="収入"
              value={formatYen(agg.income)}
              accent="#34D399"
            />
            <Stat
              label="支出"
              value={formatYen(agg.expense)}
              accent="#ff2e83"
            />
            <Stat
              label={agg.net >= 0 ? '黒字' : '赤字'}
              value={formatYen(Math.abs(agg.net))}
              accent={agg.net >= 0 ? '#34D399' : '#ff7676'}
            />
          </div>
          {tally.total > 0 && (
            <div style={{ marginTop: 16 }}>
              <SatisfactionBar
                good={tally.good}
                bad={tally.bad}
                neutral={tally.neutral}
                fulfilled={fulfilled}
              />
            </div>
          )}
        </Section>

        {/* パーソナリティ */}
        {result && (
          <Section title="性格タイプ">
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                background:
                  'linear-gradient(135deg, ' +
                  result.type.accent +
                  '22, #f5f1ff)',
                border: '1px solid #e2e5ec',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 40 }}>{result.type.emoji}</div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#5b6170',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    YOU ARE
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {result.type.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#2a2e38' }}>
                    「{result.type.tagline}」
                  </div>
                </div>
              </div>
              <p style={{ marginTop: 12, fontSize: 13, color: '#2a2e38' }}>
                {result.summary}
              </p>
            </div>
          </Section>
        )}

        {/* トップカテゴリ */}
        {topCats.length > 0 && (
          <Section title="支出トップ5">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topCats.map((c, idx) => {
                const meta = getCategoryMeta(c.category);
                const ratio = c.amount / totalForRatio;
                return (
                  <div
                    key={c.category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: '#f8f9fc',
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#8a90a0',
                        fontWeight: 700,
                        width: 16,
                        textAlign: 'center',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {meta.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {c.category}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          height: 6,
                          background: '#e2e5ec',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, ratio * 100)}%`,
                            height: '100%',
                            background: meta.color,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatYen(c.amount)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#5b6170',
                        fontVariantNumeric: 'tabular-nums',
                        width: 40,
                        textAlign: 'right',
                      }}
                    >
                      {(ratio * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 推奨 / 警告 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginTop: 24,
          }}
        >
          <RecBlock
            title="推奨カテゴリ"
            tone="good"
            items={recommended.map((r) => ({
              label: r.category,
              score: r.score,
              amount: r.amount,
            }))}
            emptyMsg="満足度評価が少なく、推奨を出せませんでした。"
          />
          <RecBlock
            title="警告カテゴリ"
            tone="bad"
            items={warnings.map((r) => ({
              label: r.category,
              score: r.score,
              amount: r.amount,
            }))}
            emptyMsg="後悔評価のついた支出がありません。"
          />
        </div>

        {/* フッタ */}
        <div
          style={{
            marginTop: 36,
            paddingTop: 14,
            borderTop: '1px solid #e2e5ec',
            fontSize: 10,
            color: '#8a90a0',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>worthit Pro · Monthly Report</span>
          <span>https://worthit-sigma.vercel.app</span>
        </div>
      </div>
    );
  },
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#5b6170',
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: '#f8f9fc',
        border: '1px solid #e2e5ec',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#5b6170',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          color: accent,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SatisfactionBar({
  good,
  bad,
  neutral,
  fulfilled,
}: {
  good: number;
  bad: number;
  neutral: number;
  fulfilled: number;
}) {
  const total = good + bad + neutral;
  if (total === 0) return null;
  const goodPct = (good / total) * 100;
  const neuPct = (neutral / total) * 100;
  const badPct = (bad / total) * 100;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#2a2e38' }}>
          満足度
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: fulfilled >= 0.6 ? '#22c55e' : fulfilled < 0.4 ? '#ef4444' : '#5b6170',
          }}
        >
          {Math.round(fulfilled * 100)}%
        </div>
      </div>
      <div
        style={{
          height: 8,
          background: '#e2e5ec',
          borderRadius: 999,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div style={{ width: `${goodPct}%`, background: '#22c55e' }} />
        <div style={{ width: `${neuPct}%`, background: '#c4c9d4' }} />
        <div style={{ width: `${badPct}%`, background: '#ef4444' }} />
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: '#5b6170',
          display: 'flex',
          gap: 14,
        }}
      >
        <span>👍 {good}件</span>
        <span>👎 {bad}件</span>
        <span>未評価 {neutral}件</span>
      </div>
    </div>
  );
}

function RecBlock({
  title,
  tone,
  items,
  emptyMsg,
}: {
  title: string;
  tone: 'good' | 'bad';
  items: Array<{ label: string; score: number; amount: number }>;
  emptyMsg: string;
}) {
  const accent = tone === 'good' ? '#22c55e' : '#ef4444';
  const bg = tone === 'good' ? '#ecfdf5' : '#fef2f2';
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        background: bg,
        border: `1px solid ${tone === 'good' ? '#a7f3d0' : '#fecaca'}`,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: accent,
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <p style={{ fontSize: 11, color: '#5b6170', lineHeight: 1.5 }}>
          {emptyMsg}
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {items.map((it) => (
            <li
              key={it.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                fontSize: 12,
                borderBottom: '1px dashed rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontWeight: 600, color: '#0f1115' }}>{it.label}</span>
              <span
                style={{
                  color: accent,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {tone === 'good' ? '+' : '−'}
                {Math.abs(Math.round(it.score * 100))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
