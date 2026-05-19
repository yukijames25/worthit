# AI パーソナル FP — Groq + Gemini 無料セットアップ

worthit の AI コーチ機能を有効にする手順。**完全無料**で運用できます。

> ⏱ 所要時間: 約 10 分

---

## アーキテクチャ

```
worthit Frontend
    ↓ POST /api/ai-coach (Supabase JWT)
Vercel Serverless Function (api/ai-coach.ts)
    ↓ 1次
Groq API (Llama 3.3 70B Versatile — 超高速・寛大な無料枠)
    ↓ もし失敗
Gemini API (Flash — 15req/min · 1500req/day 無料枠)
```

- **データプライバシー**: 個別の取引内容は送信されません。集計済み統計 (月の収入/支出合計、トップカテゴリ、満足度カウント) と質問本文のみ
- **レート制限**: 無料プラン 月3回 / Pro 無制限 (`ai_usage` テーブルでカウント)
- **コスト**: $0/月 (無料枠内)

---

## Step 1: Groq API キーを取得 (推奨・主)

1. <https://console.groq.com/keys> にアクセス → GitHub or Google でサインイン (無料)
2. **「+ Create API Key」** をクリック
3. キー名を入力 (例: `worthit-prod`) → **「Submit」**
4. 表示された `gsk_...` で始まる長い文字列を **コピー** (1度しか見えません)

→ これが `GROQ_API_KEY` です。

### Groq の無料枠 (2026年5月時点)

- llama-3.3-70b-versatile: 30 req/min, 14,400 req/day, 12,000 token/min
- 個人アプリ規模では使い切らない量

---

## Step 2: Gemini API キーを取得 (フォールバック・任意)

Groq が落ちた時の予備。設定しなくても動作します。

1. <https://aistudio.google.com/apikey> にアクセス → Google でサインイン
2. **「Create API key」** をクリック
3. プロジェクトを選択 (なければ新規作成) → **「Create API key in new project」**
4. 表示された `AIza...` で始まる文字列を **コピー**

→ これが `GEMINI_API_KEY` です。

### Gemini Flash の無料枠

- 15 req/min, 1,500 req/day
- 個人アプリには十分

---

## Step 3: Supabase で SQL マイグレーション

Supabase ダッシュボード → SQL Editor → [`supabase/schema.sql`](../supabase/schema.sql) 全体を再実行。新しく `ai_usage` テーブルが追加されます (既存テーブルは変更されません)。

---

## Step 4: Vercel に環境変数を追加

Vercel ダッシュボード → `worthit` プロジェクト → **Settings → Environment Variables**

| Key | Value | 用途 |
|---|---|---|
| `GROQ_API_KEY` | Step 1 でコピーした `gsk_...` | 1次プロバイダ |
| `GEMINI_API_KEY` | Step 2 でコピーした `AIza...` | フォールバック (任意) |

両方とも **Production + Preview + Development** にチェック。

追加後、**Redeploy** (Deployments → ⋯ → Redeploy) を忘れずに。

---

## Step 5: 動作確認

1. Vercel デプロイ後、`https://worthit-sigma.vercel.app` を開く
2. 設定 → **「AI パーソナル FP」** カードをタップ (紫のグラデーションが目印)
3. プリセット質問の 1 つをタップ、または自由質問を入力
4. 数秒で Markdown 形式の回答が返ってくる
5. 設定画面右上の利用回数カウンタが 1/3 に増える

問題がある場合:
- Vercel Functions ログ (Deployments → 最新 → Functions) でエラーを確認
- API キーの貼り間違いがないかチェック
- `ai_usage` テーブルが Supabase に存在するか確認

---

## レート制限の管理

- **Free**: 無料は月3回。3回目以降は HTTP 402 を返して UI で Pro 誘導
- **Pro**: 制限なし。利用回数は記録するが、ブロックはしない
- 毎月リセット (月キー `YYYY-MM` で集計)

レート制限の数値を変更したい場合:
- `api/ai-coach.ts` 内の `FREE_MONTHLY_LIMIT = 3` を編集

---

## モデルを変更したい場合

`api/_ai.ts` の上部を編集:

```typescript
const GROQ_MODEL = 'llama-3.3-70b-versatile';     // 速い、賢い、無料枠内
// または
const GROQ_MODEL = 'llama-3.1-8b-instant';        // 超高速、軽量、より大きい無料枠
const GROQ_MODEL = 'mixtral-8x7b-32768';          // 長い context window が必要なとき

const GEMINI_MODEL = 'gemini-2.0-flash';
// または
const GEMINI_MODEL = 'gemini-2.5-pro';             // 最高品質、制限はキツめ
```

各モデルの無料枠は提供元のドキュメントで確認してください:
- Groq: <https://console.groq.com/docs/rate-limits>
- Gemini: <https://ai.google.dev/pricing>
